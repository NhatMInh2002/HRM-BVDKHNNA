import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:8080'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') return res.status(405).json({ message: 'Method not allowed' })

  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ message: 'Unauthorized' })

  const { phone } = req.body ?? {}
  if (!phone) return res.status(400).json({ message: 'Thiếu số điện thoại' })

  const token = (session as any).accessToken
  const backendRes = await fetch(`${BACKEND}/api/employees/me/phone`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ phone }),
  }).catch(() => null)

  if (!backendRes || !backendRes.ok) {
    const err = await backendRes?.json().catch(() => null)
    return res.status(backendRes?.status ?? 502).json({ message: err?.message ?? 'Backend error' })
  }
  return res.status(200).json({ message: 'ok' })
}
