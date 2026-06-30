'use client'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams?.get('callbackUrl') ?? '/dashboard'

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd]   = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  // Bước 2 — nhập mã 6 số từ Authenticator app (chỉ hiện khi tài khoản bật 2FA)
  const [pendingToken, setPendingToken] = useState<string | null>(null)
  const [code, setCode] = useState('')

  async function signInWithToken(token: string, fullName: string, role: string) {
    const res = await signIn('credentials', {
      email, token, fullName, role,
      redirect: false,
      callbackUrl,
    })
    if (res?.ok) router.replace(callbackUrl)
    else setError('Đăng nhập thất bại, vui lòng thử lại')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth-backend/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const json = await res.json().catch(() => null)

      if (!res.ok || !json?.data) {
        setError('Email hoặc mật khẩu không đúng')
        return
      }

      if (json.data.requires2fa) {
        setPendingToken(json.data.pendingToken)
        return
      }

      await signInWithToken(json.data.token, json.data.fullName, json.data.role)
    } catch {
      setError('Không thể kết nối máy chủ')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pendingToken) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth-backend/2fa/verify-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pendingToken, code }),
      })
      const json = await res.json().catch(() => null)

      if (!res.ok || !json?.data) {
        setError(json?.message ?? 'Mã xác thực không đúng')
        return
      }

      await signInWithToken(json.data.token, json.data.fullName, json.data.role)
    } catch {
      setError('Không thể kết nối máy chủ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-950 to-blue-800 px-4">
      <div className="w-full max-w-sm">
        {/* Logo / tiêu đề */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white shadow-xl mb-4 overflow-hidden">
            <img src="/logo-nentrang.png" alt="Logo Bệnh viện Hữu Nghị Đa Khoa Nghệ An" className="w-22 h-22 object-contain p-1" />
          </div>
          <h1 className="text-lg font-bold text-white leading-snug">
            Bệnh viện Hữu Nghị Đa Khoa Nghệ An
          </h1>
          <p className="text-green-300 text-sm mt-1 font-medium">Hệ thống quản lý nhân sự</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {!pendingToken ? (
            <>
              <h2 className="text-lg font-semibold text-gray-800 mb-6">Đăng nhập</h2>

              {error && (
                <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoFocus
                    placeholder="minhnqn@bvnghean.vn"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Mật khẩu</label>
                  <div className="relative">
                    <input
                      type={showPwd ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-sm
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      tabIndex={-1}
                    >
                      {showPwd ? (
                        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd"/>
                          <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.064 7 9.542 7 .847 0 1.669-.105 2.454-.303z"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60
                    text-white font-medium py-2.5 rounded-lg text-sm transition-colors mt-2"
                >
                  {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </button>
              </form>

              <p className="text-xs text-gray-400 text-center mt-6">
                Quên mật khẩu? Liên hệ Phòng Tổ chức cán bộ
              </p>
            </>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-gray-800 mb-1">Xác thực 2 lớp</h2>
              <p className="text-sm text-gray-500 mb-6">
                Mở app Authenticator trên điện thoại, nhập mã 6 số hiện tại.
              </p>

              {error && (
                <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Mã xác thực</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={code}
                    onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                    required
                    autoFocus
                    placeholder="000000"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-center text-2xl tracking-[0.5em] font-mono
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60
                    text-white font-medium py-2.5 rounded-lg text-sm transition-colors mt-2"
                >
                  {loading ? 'Đang xác thực...' : 'Xác nhận'}
                </button>
                <button
                  type="button"
                  onClick={() => { setPendingToken(null); setCode(''); setError('') }}
                  className="w-full text-center text-xs text-gray-400 hover:text-gray-600"
                >
                  ← Quay lại đăng nhập
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-blue-400/60 text-xs mt-6">
          © 2026 Bệnh viện Hữu Nghị Đa Khoa Nghệ An
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
