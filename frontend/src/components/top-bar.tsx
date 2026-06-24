'use client'
import { signOut } from 'next-auth/react'

export function TopBar({ user }: { user?: { name?: string | null; email?: string | null } }) {
  async function handleLogout() {
    // Lấy Keycloak logout URL (có id_token_hint) từ server-side API route
    try {
      const res = await fetch('/api/auth/keycloak-logout-url')
      const { url } = await res.json()
      await signOut({ redirect: false })
      window.location.href = url
    } catch {
      // fallback: chỉ xóa NextAuth session
      signOut({ callbackUrl: '/login' })
    }
  }

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
      <div />
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">{user?.name ?? user?.email}</span>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-500 hover:text-red-600 transition-colors"
        >
          Đăng xuất
        </button>
      </div>
    </header>
  )
}
