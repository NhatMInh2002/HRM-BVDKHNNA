'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function OtpSettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [phone, setPhone]         = useState('')
  const [savedPhone, setSavedPhone] = useState('')
  const [agreed, setAgreed]       = useState(false)
  const [saving, setSaving]       = useState(false)
  const [toast, setToast]         = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') { router.replace('/login'); return }
    if (status !== 'authenticated') return
    // Load số điện thoại hiện tại từ profile
    const token = (session as any)?.accessToken
    if (!token) return
    fetch('/api/profile', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const p = data?.data?.phone ?? data?.phone ?? ''
        setPhone(p)
        setSavedPhone(p)
      })
      .catch(() => {})
  }, [status])

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3500)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!agreed) { showToast('error', 'Vui lòng tích vào ô đồng ý đăng ký.'); return }
    if (!phone.trim()) { showToast('error', 'Vui lòng nhập số di động.'); return }
    if (!/^(0|\+84)[0-9]{9}$/.test(phone.trim())) {
      showToast('error', 'Số điện thoại không hợp lệ (VD: 0858682425).'); return
    }
    setSaving(true)
    try {
      const token = (session as any)?.accessToken
      const res = await fetch('/api/settings/otp-phone', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ phone: phone.trim() }),
      })
      if (res.ok) {
        setSavedPhone(phone.trim())
        setAgreed(false)
        showToast('success', 'Cập nhật số điện thoại nhận mã xác thực thành công!')
      } else {
        const err = await res.json().catch(() => null)
        showToast('error', err?.message ?? 'Có lỗi xảy ra, vui lòng thử lại.')
      }
    } catch {
      showToast('error', 'Không thể kết nối máy chủ.')
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading') {
    return <div className="flex items-center justify-center h-64 text-gray-400">Đang tải...</div>
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <span className="text-gray-400">Hệ thống</span>
        <span className="text-gray-300">›</span>
        <span className="text-gray-700 font-medium">Đăng ký nhận mã xác thực</span>
      </div>

      <h1 className="text-xl font-semibold text-gray-800 mb-6">Đăng ký nhận mã xác thực</h1>

      {/* Toast */}
      {toast && (
        <div className={`mb-5 px-4 py-3 rounded-lg text-sm font-medium border
          ${toast.type === 'success'
            ? 'bg-green-50 text-green-700 border-green-200'
            : 'bg-red-50 text-red-700 border-red-200'}`}>
          {toast.msg}
        </div>
      )}

      {/* Form card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-5">
        <form onSubmit={handleSubmit}>
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="px-6 py-4 text-right font-medium text-gray-600 w-52 bg-gray-50">
                  Số di động hiện tại:
                </td>
                <td className="px-6 py-4">
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="VD: 0858682425"
                    className="w-full max-w-xs border border-gray-300 rounded px-3 py-1.5 text-sm
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="px-6 py-4 text-right font-medium text-gray-600 bg-gray-50">
                  Đồng ý đăng ký:
                </td>
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    id="agree"
                    checked={agreed}
                    onChange={e => setAgreed(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded cursor-pointer"
                  />
                  <label htmlFor="agree" className="ml-2 text-gray-600 cursor-pointer select-none">
                    Tôi đồng ý đăng ký nhận mã xác thực qua số di động trên
                  </label>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 bg-gray-50" />
                <td className="px-6 py-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded text-sm font-medium
                      bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60 transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293z"/>
                    </svg>
                    {saving ? 'Đang cập nhật...' : 'Cập nhật'}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </form>
      </div>

      {/* Chú ý */}
      <div className="bg-red-600 text-white rounded-xl px-6 py-5 text-sm">
        <p className="font-semibold text-base mb-3">Chú ý!</p>
        <ul className="space-y-2 list-none">
          <li className="flex gap-2">
            <span className="mt-0.5 flex-shrink-0">▶</span>
            <span>
              Hệ thống HRM được ứng dụng công nghệ{' '}
              <strong>"Mã xác thực theo ngày để bảo mật"</strong>.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="mt-0.5 flex-shrink-0">▶</span>
            <span>
              Khi đăng nhập hệ thống, ngoài mật khẩu của tài khoản thì người dùng phải nhập thêm
              Mã xác thực được gửi đến máy di động mà bạn đăng ký khi sử dụng hệ thống.
            </span>
          </li>
        </ul>
      </div>

      {/* Trạng thái hiện tại */}
      {savedPhone && (
        <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
          <svg className="w-4 h-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
          </svg>
          Số đang đăng ký: <strong className="text-gray-700">{savedPhone}</strong>
        </div>
      )}
    </div>
  )
}
