'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'

const Icons = {
  dashboard: <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z"/><path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z"/></svg>,
  personnel: <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/></svg>,
  department: <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd"/></svg>,
  category:  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z"/></svg>,
  attendance:<svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/></svg>,
  leave:     <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/></svg>,
  payroll:   <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/><path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"/></svg>,
  config:    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1h5v2H5a1 1 0 01-1-1zm7 1h4a1 1 0 001-1v-1h-5v2zm0-4h5V8h-5v2zM9 8H4v2h5V8z" clipRule="evenodd"/></svg>,
  recruit:   <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/></svg>,
  settings:  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z"/></svg>,
  profile:   <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/></svg>,
  otp:       <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/></svg>,
  shield:    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>,
  logout:    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd"/></svg>,
  chevron:   <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/></svg>,
}

type AppRole = 'ADMIN' | 'HR_MANAGER' | 'DEPARTMENT_MANAGER' | 'EMPLOYEE' | 'ACCOUNTANT'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  roles?: AppRole[]
  exact?: boolean
}

interface NavGroup {
  key: string
  label?: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    key: 'overview',
    items: [
      { href: '/dashboard',         label: 'Tổng quan',      icon: Icons.dashboard, exact: true },
      { href: '/dashboard/profile', label: 'Hồ sơ cá nhân', icon: Icons.profile, exact: true },
    ],
  },
  {
    key: 'hr', label: 'NHÂN SỰ',
    items: [
      { href: '/dashboard/personnel',   label: 'Cán bộ nhân viên', icon: Icons.personnel, roles: ['ADMIN','HR_MANAGER','DEPARTMENT_MANAGER'] },
      { href: '/dashboard/departments', label: 'Phòng ban / Khoa',  icon: Icons.department },
      { href: '/dashboard/categories',  label: 'Danh mục',          icon: Icons.category, roles: ['ADMIN','HR_MANAGER'] },
    ],
  },
  {
    key: 'time', label: 'CHẤM CÔNG',
    items: [
      { href: '/dashboard/attendance',       label: 'Chấm công', icon: Icons.attendance, exact: true },
      { href: '/dashboard/attendance/leave', label: 'Nghỉ phép', icon: Icons.leave },
    ],
  },
  {
    key: 'salary', label: 'LƯƠNG',
    items: [
      { href: '/dashboard/payroll/my',     label: 'Lương cá nhân',  icon: Icons.payroll, exact: true },
      { href: '/dashboard/payroll',        label: 'Bảng lương',     icon: Icons.config,  roles: ['ADMIN','HR_MANAGER','ACCOUNTANT'], exact: true },
      { href: '/dashboard/payroll/config', label: 'Cấu hình lương', icon: Icons.settings, roles: ['ADMIN','HR_MANAGER'] },
    ],
  },
  {
    key: 'recruit', label: 'TUYỂN DỤNG',
    items: [{ href: '/dashboard/recruitment', label: 'Tuyển dụng', icon: Icons.recruit, roles: ['ADMIN','HR_MANAGER'] }],
  },
]

// Menu con Cài đặt hệ thống
const SETTINGS_CHILDREN: NavItem[] = [
  { href: '/dashboard/settings',     label: 'Phân quyền',        icon: Icons.shield, roles: ['ADMIN'], exact: true },
  { href: '/dashboard/settings/otp', label: 'Đăng ký mã xác thực', icon: Icons.otp },
]

function isActive(href: string, pathname: string, exact?: boolean): boolean {
  if (exact) return pathname === href
  return pathname === href || pathname.startsWith(href + '/')
}

export function SideNav({ roles }: { roles: string[] }) {
  const pathname = usePathname() ?? ''
  const [expanded, setExpanded] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(
    pathname.startsWith('/dashboard/settings')
  )

  const canSee = (required?: AppRole[]) =>
    !required || required.length === 0 || required.some(r => roles.includes(r))

  const settingsActive = pathname.startsWith('/dashboard/settings')
  const isAdmin = roles.includes('ADMIN')

  return (
    <aside
      className={`flex-shrink-0 flex flex-col
        bg-[#1a2b4a] text-white border-r border-[#243556]
        transition-[width] duration-200 ease-in-out overflow-hidden
        ${expanded ? 'w-60' : 'w-14'}`}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      {/* Logo */}
      <div className="flex items-center h-14 border-b border-[#243556] flex-shrink-0 px-3">
        <div className="w-8 h-8 rounded bg-blue-500 flex items-center justify-center
                        text-white font-bold text-sm flex-shrink-0 select-none">
          H
        </div>
        <div className={`ml-3 overflow-hidden transition-opacity duration-150
                         ${expanded ? 'opacity-100' : 'opacity-0'}`}>
          <p className="text-sm font-semibold text-white leading-tight whitespace-nowrap">HRM BVHN</p>
          <p className="text-[11px] text-blue-300 leading-tight whitespace-nowrap">Đa khoa Nghệ An</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2">
        {NAV_GROUPS.map(group => (
          <div key={group.key} className={group.label ? 'mt-1' : ''}>
            <div className={`overflow-hidden transition-all duration-150
                             ${expanded ? 'max-h-8 opacity-100' : 'max-h-0 opacity-0'}`}>
              {group.label && (
                <p className="text-[10px] font-semibold text-blue-400/60 tracking-widest
                              px-4 pt-3 pb-1 uppercase whitespace-nowrap">
                  {group.label}
                </p>
              )}
            </div>
            {group.label && !expanded && (
              <div className="mx-3 mt-2 mb-1 border-t border-[#243556]" />
            )}

            {group.items.filter(item => canSee(item.roles)).map(item => {
              const active = isActive(item.href, pathname, item.exact)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={!expanded ? item.label : undefined}
                  className={`relative flex items-center mx-2 px-2 py-2 rounded text-[13px]
                    font-medium transition-colors duration-100
                    ${active
                      ? 'bg-blue-600 text-white'
                      : 'text-blue-200 hover:bg-[#243556] hover:text-white'}`}
                >
                  {active && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r bg-blue-300" />
                  )}
                  <span className={`flex-shrink-0 w-5 flex items-center justify-center
                    ${active ? 'text-white' : 'text-blue-400'}`}>
                    {item.icon}
                  </span>
                  <span className={`ml-3 whitespace-nowrap transition-opacity duration-150
                    ${expanded ? 'opacity-100' : 'opacity-0'}`}>
                    {item.label}
                  </span>
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Bottom — Cài đặt hệ thống (chỉ Admin) */}
      {isAdmin && (
        <div className="border-t border-[#243556] py-2 px-2 flex-shrink-0">
          {/* Toggle button */}
          <button
            onClick={() => expanded && setSettingsOpen(o => !o)}
            title={!expanded ? 'Cài đặt hệ thống' : undefined}
            className={`w-full flex items-center px-2 py-2 rounded text-[13px] font-medium
              transition-colors duration-100
              ${settingsActive
                ? 'bg-blue-600/30 text-white'
                : 'text-blue-200 hover:bg-[#243556] hover:text-white'}`}
          >
            <span className={`flex-shrink-0 w-5 flex items-center justify-center
              ${settingsActive ? 'text-blue-300' : 'text-blue-400'}`}>
              {Icons.settings}
            </span>
            <span className={`ml-3 flex-1 text-left whitespace-nowrap transition-opacity duration-150
              ${expanded ? 'opacity-100' : 'opacity-0'}`}>
              Cài đặt hệ thống
            </span>
            {expanded && (
              <span className={`transition-transform duration-200 text-blue-400
                ${settingsOpen ? 'rotate-180' : ''}`}>
                {Icons.chevron}
              </span>
            )}
          </button>

          {/* Submenu */}
          <div className={`overflow-hidden transition-all duration-200
            ${expanded && settingsOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
            {SETTINGS_CHILDREN.filter(item => canSee(item.roles)).map(item => {
              const active = isActive(item.href, pathname, item.exact)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center ml-4 mr-1 px-2 py-1.5 rounded text-[12px]
                    font-medium transition-colors duration-100 mt-0.5
                    ${active
                      ? 'bg-blue-600 text-white'
                      : 'text-blue-300 hover:bg-[#243556] hover:text-white'}`}
                >
                  {active && (
                    <span className="absolute left-0 top-1 bottom-1 w-0.5 rounded-r bg-blue-300" />
                  )}
                  <span className={`flex-shrink-0 w-4 flex items-center justify-center
                    ${active ? 'text-white' : 'text-blue-400'}`}>
                    {item.icon}
                  </span>
                  <span className="ml-2 whitespace-nowrap">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Đăng xuất */}
      <div className={`${isAdmin ? '' : 'border-t border-[#243556]'} pb-2 px-2 flex-shrink-0`}>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          title={!expanded ? 'Đăng xuất' : undefined}
          className="w-full flex items-center px-2 py-2 rounded text-[13px] font-medium
                     text-blue-200 hover:bg-red-700/80 hover:text-white transition-colors"
        >
          <span className="flex-shrink-0 w-5 flex items-center justify-center text-blue-400">
            {Icons.logout}
          </span>
          <span className={`ml-3 whitespace-nowrap transition-opacity duration-150
            ${expanded ? 'opacity-100' : 'opacity-0'}`}>
            Đăng xuất
          </span>
        </button>
      </div>
    </aside>
  )
}
