'use client'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function LoginPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'authenticated') router.replace('/dashboard')
  }, [status, router])

  if (status === 'loading') return null

  return (
    <main className="min-h-screen flex items-center justify-center bg-blue-50">
      <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-sm text-center">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-blue-800">HRM</h1>
          <p className="text-sm text-gray-500 mt-1">BVĐK Hà Nội NA</p>
        </div>
        <p className="text-gray-600 mb-8 text-sm">
          Đăng nhập bằng tài khoản nội bộ của bệnh viện
        </p>
        <button
          onClick={() => signIn('keycloak', { callbackUrl: '/dashboard' })}
          className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          Đăng nhập với SSO
        </button>
        <p className="text-xs text-gray-400 mt-6">
          Liên hệ IT nếu không thể đăng nhập
        </p>
      </div>
    </main>
  )
}
