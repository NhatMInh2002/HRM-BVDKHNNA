'use client'
import { useState, useRef, useEffect } from 'react'
import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import {
  getMyNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  NOTIFICATION_META,
  AppNotification,
} from '@/lib/notifications'

// ── Avatar với chữ viết tắt ────────────────────────────────────────────────
function Avatar({ name, size = 'md' }: { name?: string | null; size?: 'sm' | 'md' }) {
  const initials = (name ?? '?')
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map(w => w[0])
    .join('')
    .toUpperCase()
  const sz = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm'
  return (
    <div className={`${sz} rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold flex-shrink-0`}>
      {initials}
    </div>
  )
}

// ── Modal đổi mật khẩu ─────────────────────────────────────────────────────
function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ current: '', next: '', confirm: '' })
  const [error, setError] = useState('')
  const [strength, setStrength] = useState(0)

  const mutation = useMutation({
    mutationFn: () =>
      apiFetch('/auth-backend/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword: form.current, newPassword: form.next }),
      }),
    onSuccess: () => { onClose() },
    onError: (e: Error) => setError(e.message),
  })

  function calcStrength(pw: string) {
    let s = 0
    if (pw.length >= 8) s++
    if (/[A-Z]/.test(pw)) s++
    if (/[0-9]/.test(pw)) s++
    if (/[^A-Za-z0-9]/.test(pw)) s++
    return s
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (form.next !== form.confirm) { setError('Mật khẩu xác nhận không khớp'); return }
    if (form.next.length < 8)       { setError('Mật khẩu mới phải có ít nhất 8 ký tự'); return }
    mutation.mutate()
  }

  const strengthColors = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500']
  const strengthLabels = ['', 'Yếu', 'Trung bình', 'Tốt', 'Mạnh']

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold">Đổi mật khẩu</h2>
              <p className="text-blue-200 text-xs mt-0.5">Cập nhật mật khẩu đăng nhập của bạn</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Current password */}
          <PasswordField
            label="Mật khẩu hiện tại"
            value={form.current}
            onChange={v => setForm(f => ({ ...f, current: v }))}
            autoFocus
          />

          {/* New password */}
          <div className="space-y-1.5">
            <PasswordField
              label="Mật khẩu mới"
              value={form.next}
              onChange={v => { setForm(f => ({ ...f, next: v })); setStrength(calcStrength(v)) }}
            />
            {form.next.length > 0 && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[1,2,3,4].map(i => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                      i <= strength ? strengthColors[strength - 1] : 'bg-gray-200'
                    }`} />
                  ))}
                </div>
                <p className="text-xs text-gray-500">{strengthLabels[strength]}</p>
              </div>
            )}
          </div>

          {/* Confirm */}
          <PasswordField
            label="Xác nhận mật khẩu mới"
            value={form.confirm}
            onChange={v => setForm(f => ({ ...f, confirm: v }))}
          />

          {/* Rules */}
          <div className="bg-blue-50 rounded-xl p-3 space-y-1">
            {[
              ['length', form.next.length >= 8, 'Ít nhất 8 ký tự'],
              ['upper',  /[A-Z]/.test(form.next), 'Có chữ hoa'],
              ['digit',  /[0-9]/.test(form.next), 'Có chữ số'],
              ['special', /[^A-Za-z0-9]/.test(form.next), 'Có ký tự đặc biệt'],
            ].map(([key, ok, label]) => (
              <div key={key as string} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                  ok ? 'bg-green-500' : 'bg-gray-200'
                }`}>
                  {ok && <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>}
                </div>
                <span className={`text-xs ${ok ? 'text-green-700' : 'text-gray-500'}`}>{label as string}</span>
              </div>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-red-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {mutation.isSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">
              Đổi mật khẩu thành công!
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors font-medium">
              Hủy
            </button>
            <button type="submit" disabled={mutation.isPending}
              className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors">
              {mutation.isPending ? 'Đang lưu…' : 'Cập nhật'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function PasswordField({ label, value, onChange, autoFocus }: {
  label: string; value: string; onChange: (v: string) => void; autoFocus?: boolean
}) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          autoFocus={autoFocus}
          required
          className="w-full px-4 py-2.5 pr-11 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />
        <button type="button" tabIndex={-1}
          onClick={() => setShow(v => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          {show ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21"/>
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}

// ── Dropdown menu item ─────────────────────────────────────────────────────
function MenuItem({ icon, label, onClick, href, danger }: {
  icon: React.ReactNode; label: string
  onClick?: () => void; href?: string; danger?: boolean
}) {
  const cls = `w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg transition-colors ${
    danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-50'
  }`
  if (href) return (
    <Link href={href} className={cls}>{icon}{label}</Link>
  )
  return (
    <button onClick={onClick} className={cls}>{icon}{label}</button>
  )
}

// ── NotificationBell ──────────────────────────────────────────────────────
function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60)   return 'vừa xong'
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`
  return `${Math.floor(diff / 86400)} ngày trước`
}

function NotificationBell() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const qc = useQueryClient()

  const { data: countData } = useQuery({
    queryKey: ['notif-count'],
    queryFn: getUnreadCount,
    refetchInterval: 30_000,
    staleTime: 20_000,
  })
  const unread = countData?.unread ?? 0

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: getMyNotifications,
    enabled: open,
    staleTime: 15_000,
  })

  const markRead = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] })
      .then(() => qc.invalidateQueries({ queryKey: ['notif-count'] })),
  })

  const markAll = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: ['notif-count'] })
    },
  })

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  function handleOpen() {
    setOpen(v => !v)
  }

  function handleClick(n: AppNotification) {
    if (!n.isRead) markRead.mutate(n.id)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
        </svg>
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-gray-800">Thông báo</h3>
              {unread > 0 && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                  {unread} chưa đọc
                </span>
              )}
            </div>
            {unread > 0 && (
              <button
                onClick={() => markAll.mutate()}
                className="text-xs text-blue-600 hover:underline font-medium"
              >
                Đọc tất cả
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <svg className="w-12 h-12 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                </svg>
                <p className="text-sm">Chưa có thông báo nào</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifications.map(n => {
                  const meta = NOTIFICATION_META[n.type] ?? NOTIFICATION_META.SYSTEM
                  const inner = (
                    <div
                      key={n.id}
                      onClick={() => handleClick(n)}
                      className={`flex gap-3 px-4 py-3 cursor-pointer transition-colors ${
                        n.isRead ? 'hover:bg-gray-50' : 'bg-blue-50/60 hover:bg-blue-50'
                      }`}
                    >
                      {/* Icon */}
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base ${meta.bg}`}>
                        {meta.icon}
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm leading-snug ${n.isRead ? 'text-gray-700' : 'text-gray-900 font-semibold'}`}>
                            {n.title}
                          </p>
                          {!n.isRead && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                          )}
                        </div>
                        {n.body && (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
                        )}
                        <p className="text-[11px] text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                      </div>
                    </div>
                  )
                  return n.link
                    ? <Link key={n.id} href={n.link}>{inner}</Link>
                    : <div key={n.id}>{inner}</div>
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── TopBar ─────────────────────────────────────────────────────────────────
export function TopBar({ user }: { user?: { name?: string | null; email?: string | null } }) {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const [showChangePwd, setShowChangePwd] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const role = session?.role as string | undefined
  const roleLabel: Record<string, string> = {
    ADMIN: 'Quản trị viên',
    HR_MANAGER: 'Quản lý nhân sự',
    EMPLOYEE: 'Nhân viên',
  }

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  async function handleLogout() {
    setOpen(false)
    try {
      const res = await fetch('/api/auth/keycloak-logout-url')
      const { url } = await res.json()
      await signOut({ redirect: false })
      window.location.href = url
    } catch {
      signOut({ callbackUrl: '/login' })
    }
  }

  return (
    <>
      <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0 z-30">
        {/* Logo / breadcrumb slot */}
        <div />

        {/* Right side */}
        <div className="flex items-center gap-3">
          <NotificationBell />

          {/* User dropdown */}
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setOpen(v => !v)}
              className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <Avatar name={user?.name} />
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold text-gray-800 leading-none">{user?.name ?? user?.email}</p>
                {role && <p className="text-xs text-gray-400 mt-0.5">{roleLabel[role] ?? role}</p>}
              </div>
              <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
                viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
            </button>

            {/* Dropdown */}
            {open && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
                {/* User info header */}
                <div className="px-4 py-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <Avatar name={user?.name} size="md" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-800 truncate">{user?.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                      {role && (
                        <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                          {roleLabel[role] ?? role}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Menu items */}
                <div className="p-2">
                  <MenuItem
                    href="/dashboard/profile"
                    onClick={() => setOpen(false)}
                    label="Hồ sơ cá nhân"
                    icon={
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                      </svg>
                    }
                  />
                  <MenuItem
                    onClick={() => { setOpen(false); setShowChangePwd(true) }}
                    label="Đổi mật khẩu"
                    icon={
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
                      </svg>
                    }
                  />
                  <MenuItem
                    href="/dashboard/attendance/leave"
                    onClick={() => setOpen(false)}
                    label="Đơn nghỉ phép của tôi"
                    icon={
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                      </svg>
                    }
                  />
                  <MenuItem
                    href="/dashboard/payroll/my"
                    onClick={() => setOpen(false)}
                    label="Bảng lương của tôi"
                    icon={
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
                      </svg>
                    }
                  />
                </div>

                <div className="border-t border-gray-100 p-2">
                  <MenuItem
                    onClick={handleLogout}
                    label="Đăng xuất"
                    danger
                    icon={
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                      </svg>
                    }
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {showChangePwd && (
        <ChangePasswordModal onClose={() => setShowChangePwd(false)} />
      )}
    </>
  )
}
