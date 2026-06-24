import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:8080'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ message: 'Unauthorized' })

  const token = (session as any).accessToken
  const backendRes = await fetch(`${BACKEND}/api/employees/me`, {
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => null)

  if (!backendRes || !backendRes.ok) {
    return res.status(backendRes?.status ?? 502).json({ message: 'Backend error' })
  }
  const data = await backendRes.json()
  return res.status(200).json(data)
}
