'use client'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function LoginPage() {
  const { status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/dashboard')
    } else if (status === 'unauthenticated') {
      signIn('keycloak', { callbackUrl: '/dashboard' })
    }
  }, [status, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-sm text-gray-400">Đang chuyển hướng đến trang đăng nhập...</p>
    </div>
  )
}
