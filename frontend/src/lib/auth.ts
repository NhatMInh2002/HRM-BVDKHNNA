import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

declare module 'next-auth' {
  interface Session {
    accessToken?: string
    role?: string
    roles?: string[]
    error?: string
  }
  interface User {
    token: string
    role: string
    fullName: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string
    role?: string
    roles?: string[]
    fullName?: string
  }
}

const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:8080'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'HRM Login',
      credentials: {
        email:    { label: 'Email',      type: 'email' },
        password: { label: 'Mật khẩu',  type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const res = await fetch(`${BACKEND}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email:    credentials.email,
            password: credentials.password,
          }),
        })

        const json = await res.json().catch(() => null)
        if (!res.ok || !json?.data) return null

        const { token, email, fullName, role } = json.data
        return { id: email, email, name: fullName, fullName, token, role }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = (user as any).token
        token.role        = (user as any).role
        token.roles       = [(user as any).role]
        token.fullName    = (user as any).fullName
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken
      session.role        = token.role
      session.roles       = token.roles ?? []
      if (session.user) {
        session.user.name = token.fullName ?? session.user.name
      }
      return session
    },
  },

  pages: {
    signIn: '/login',
    error:  '/login',
  },

  session: { strategy: 'jwt', maxAge: 24 * 60 * 60 },
}
