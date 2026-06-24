import type { NextApiRequest, NextApiResponse } from 'next'
import { getToken } from 'next-auth/jwt'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return res.status(401).json({ error: 'Not authenticated' })

  const issuer = process.env.KEYCLOAK_ISSUER!
  const url = new URL(`${issuer}/protocol/openid-connect/logout`)
  url.searchParams.set('client_id', process.env.KEYCLOAK_CLIENT_ID!)
  url.searchParams.set('post_logout_redirect_uri', `${process.env.NEXTAUTH_URL}/login`)
  if (token.idToken) url.searchParams.set('id_token_hint', token.idToken as string)

  res.json({ url: url.toString() })
}
