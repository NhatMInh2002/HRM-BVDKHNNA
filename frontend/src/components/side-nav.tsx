'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/dashboard', label: 'Tổng quan', roles: [] },
  { href: '/dashboard/personnel', label: 'Nhân sự', roles: ['ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER'] },
  { href: '/dashboard/org-chart', label: 'Sơ đồ tổ chức', roles: ['ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER'] },
  { href: '/dashboard/attendance', label: 'Chấm công', roles: ['ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER'] },
  { href: '/dashboard/payroll', label: 'Lương', roles: ['ADMIN', 'HR_MANAGER'] },
  { href: '/dashboard/recruitment', label: 'Tuyển dụng', roles: ['ADMIN', 'HR_MANAGER'] },
]

export function SideNav({ roles }: { roles: string[] }) {
  const pathname = usePathname()

  const visible = NAV.filter(item =>
    item.roles.length === 0 || item.roles.some(r => roles.includes(r))
  )

  return (
    <nav className="w-56 bg-blue-900 text-white flex flex-col flex-shrink-0">
      <div className="px-5 py-5 border-b border-blue-800">
        <span className="text-lg font-bold tracking-wide">HRM</span>
        <p className="text-xs text-blue-300 mt-0.5">BVĐK Hà Nội NA</p>
      </div>
      <ul className="flex-1 py-4 space-y-1 px-2">
        {visible.map(item => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${active ? 'bg-blue-700 text-white' : 'text-blue-200 hover:bg-blue-800 hover:text-white'}`}
              >
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
