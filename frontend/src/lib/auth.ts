import { NextAuthOptions } from 'next-auth'
import KeycloakProvider from 'next-auth/providers/keycloak'

declare module 'next-auth' {
  interface Session {
    accessToken?: string
    roles?: string[]
    error?: string
  }
  interface Token {
    accessToken?: string
    refreshToken?: string
    expiresAt?: number
    roles?: string[]
    error?: string
  }
}

async function refreshAccessToken(token: any) {
  try {
    const res = await fetch(
      `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.KEYCLOAK_CLIENT_ID!,
          client_secret: process.env.KEYCLOAK_CLIENT_SECRET!,
          grant_type: 'refresh_token',
          refresh_token: token.refreshToken,
        }),
      }
    )
    const data = await res.json()
    if (!res.ok) throw data
    return {
      ...token,
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? token.refreshToken,
      expiresAt: Math.floor(Date.now() / 1000) + data.expires_in,
      error: undefined,
    }
  } catch {
    return { ...token, error: 'RefreshTokenError' }
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
      issuer: process.env.KEYCLOAK_ISSUER!,
      checks: ['state'],  // tắt PKCE — dùng state-only
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // Lần đầu đăng nhập
      if (account) {
        const p = profile as any
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at,
          roles: p?.roles ?? [],
        }
      }
      // Token còn hạn
      if (Date.now() / 1000 < (token.expiresAt as number) - 30) return token
      // Refresh
      return refreshAccessToken(token)
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string
      session.roles = token.roles as string[]
      session.error = token.error as string | undefined
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
}
