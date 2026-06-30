'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { getTotpStatus, setupTotp, confirmTotp, disableTotp, type TotpSetupResponse } from '@/lib/totp'

export default function TotpSettingsPage() {
  const { status } = useSession()
  const router = useRouter()

  const [enabled, setEnabled]   = useState<boolean | null>(null)
  const [setupData, setSetupData] = useState<TotpSetupResponse | null>(null)
  const [code, setCode]         = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [toast, setToast]       = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [showDisableForm, setShowDisableForm] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') { router.replace('/login'); return }
    if (status !== 'authenticated') return
    getTotpStatus().then(r => setEnabled(r.enabled)).catch(() => setEnabled(false))
  }, [status])

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 4000)
  }

  async function handleStartSetup() {
    setLoading(true)
    try {
      const data = await setupTotp()
      setSetupData(data)
    } catch (e: any) {
      showToast('error', e?.message ?? 'Không thể khởi tạo thiết lập 2FA')
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault()
    if (code.length !== 6) return
    setLoading(true)
    try {
      await confirmTotp(code)
      setEnabled(true)
      setSetupData(null)
      setCode('')
      showToast('success', 'Đã bật xác thực 2 lớp thành công!')
    } catch (e: any) {
      showToast('error', e?.message ?? 'Mã xác thực không đúng')
    } finally {
      setLoading(false)
    }
  }

  async function handleDisable(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await disableTotp(password)
      setEnabled(false)
      setShowDisableForm(false)
      setPassword('')
      showToast('success', 'Đã tắt xác thực 2 lớp.')
    } catch (e: any) {
      showToast('error', e?.message ?? 'Mật khẩu không đúng')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || enabled === null) {
    return <div className="flex items-center justify-center h-64 text-gray-400">Đang tải...</div>
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <span className="text-gray-400">Hệ thống</span>
        <span className="text-gray-300">›</span>
        <span className="text-gray-700 font-medium">Xác thực 2 lớp (2FA)</span>
      </div>

      <h1 className="text-xl font-semibold text-gray-800 mb-6">Xác thực 2 lớp (2FA)</h1>

      {toast && (
        <div className={`mb-5 px-4 py-3 rounded-lg text-sm font-medium border
          ${toast.type === 'success'
            ? 'bg-green-50 text-green-700 border-green-200'
            : 'bg-red-50 text-red-700 border-red-200'}`}>
          {toast.msg}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-5">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-800">Trạng thái</p>
            <p className="text-sm text-gray-500 mt-0.5">
              Dùng app Google/Microsoft Authenticator để sinh mã đăng nhập, không phụ thuộc SMS/email.
            </p>
          </div>
          <span className={`text-xs px-3 py-1 rounded-full font-medium flex-shrink-0 ${
            enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
          }`}>
            {enabled ? 'Đang bật' : 'Đang tắt'}
          </span>
        </div>

        <div className="p-6">
          {/* Đã bật — cho phép tắt */}
          {enabled && !showDisableForm && (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Tài khoản của bạn đang được bảo vệ bằng xác thực 2 lớp. Mỗi lần đăng nhập sẽ cần thêm
                mã 6 số từ app Authenticator.
              </p>
              <button onClick={() => setShowDisableForm(true)}
                className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50">
                Tắt xác thực 2 lớp
              </button>
            </div>
          )}

          {enabled && showDisableForm && (
            <form onSubmit={handleDisable} className="space-y-3">
              <p className="text-sm text-gray-600">Nhập mật khẩu để xác nhận tắt 2FA:</p>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                required autoFocus placeholder="Mật khẩu hiện tại"
                className="w-full max-w-xs border border-gray-300 rounded-lg px-3 py-2 text-sm
                  focus:outline-none focus:ring-2 focus:ring-red-400" />
              <div className="flex gap-2">
                <button type="submit" disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-60">
                  {loading ? 'Đang xử lý...' : 'Xác nhận tắt'}
                </button>
                <button type="button" onClick={() => { setShowDisableForm(false); setPassword('') }}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                  Hủy
                </button>
              </div>
            </form>
          )}

          {/* Chưa bật, chưa bắt đầu setup */}
          {!enabled && !setupData && (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Bật xác thực 2 lớp để tăng bảo mật tài khoản — kể cả khi lộ mật khẩu, kẻ tấn công
                vẫn không đăng nhập được nếu không có mã từ điện thoại của bạn.
              </p>
              <button onClick={handleStartSetup} disabled={loading}
                className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60">
                {loading ? 'Đang khởi tạo...' : 'Bắt đầu thiết lập'}
              </button>
            </div>
          )}

          {/* Đang setup — hiện QR code */}
          {!enabled && setupData && (
            <div>
              <ol className="text-sm text-gray-600 space-y-1.5 mb-5 list-decimal list-inside">
                <li>Mở app <strong className="text-gray-800">Google Authenticator</strong> hoặc <strong className="text-gray-800">Microsoft Authenticator</strong> trên điện thoại</li>
                <li>Chọn &ldquo;Quét mã QR&rdquo; và quét ảnh bên dưới</li>
                <li>Nhập mã 6 số app vừa hiện ra để xác nhận</li>
              </ol>

              <div className="flex justify-center mb-5">
                <img src={setupData.qrCodeUri} alt="QR code thiết lập 2FA"
                  className="w-56 h-56 border border-gray-200 rounded-lg" />
              </div>

              <details className="mb-5 text-xs text-gray-500">
                <summary className="cursor-pointer hover:text-gray-700">Không quét được? Nhập mã thủ công</summary>
                <code className="block mt-2 px-3 py-2 bg-gray-50 rounded border border-gray-200 break-all">
                  {setupData.secret}
                </code>
              </details>

              <form onSubmit={handleConfirm} className="flex items-end gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Mã xác thực</label>
                  <input
                    type="text" inputMode="numeric" maxLength={6}
                    value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                    required autoFocus placeholder="000000"
                    className="w-40 border border-gray-300 rounded-lg px-3 py-2 text-center text-lg tracking-[0.3em] font-mono
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button type="submit" disabled={loading || code.length !== 6}
                  className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60">
                  {loading ? 'Đang xác nhận...' : 'Xác nhận & bật'}
                </button>
                <button type="button" onClick={() => { setSetupData(null); setCode('') }}
                  className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">
                  Hủy
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
