import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const roles = session?.roles ?? []

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Tổng quan</h1>
      <p className="text-sm text-gray-500 mb-6">
        Chào mừng, <span className="font-medium">{session?.user?.name}</span>
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Nhân viên" value="—" />
        <StatCard label="Chấm công hôm nay" value="—" />
        <StatCard label="Đơn nghỉ phép chờ duyệt" value="—" />
        <StatCard label="Hợp đồng sắp hết hạn" value="—" />
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-3xl font-bold text-gray-800 mt-2">{value}</p>
    </div>
  )
}
