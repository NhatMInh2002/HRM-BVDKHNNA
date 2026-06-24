'use client'
import { useCurrentEmployee } from '@/hooks/useCurrentEmployee'
import { format } from 'date-fns'
import { CONTRACT_TYPE_LABELS, STATUS_LABELS } from '@/lib/personnel'

const GENDER_LABELS: Record<string, string> = {
  MALE: 'Nam', FEMALE: 'Nữ', OTHER: 'Khác',
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm text-gray-800 font-medium">{value || '—'}</p>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{title}</h2>
      </div>
      <div className="px-5 py-4 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
        {children}
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const { data: me, isLoading } = useCurrentEmployee()

  if (isLoading) {
    return <div className="text-gray-400 text-sm p-8 text-center">Đang tải...</div>
  }

  if (!me) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center text-sm text-yellow-800 max-w-lg mx-auto mt-8">
        <p className="font-semibold mb-1">Tài khoản chưa được liên kết</p>
        <p className="text-yellow-700">Vui lòng liên hệ Phòng Tổ chức cán bộ để được hỗ trợ.</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Avatar + tên */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 select-none">
          {me.fullName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-gray-800 truncate">{me.fullName}</h1>
          <p className="text-sm text-gray-500">{me.position || 'Chưa có chức vụ'}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {me.department?.name || 'Chưa gán phòng ban'} · {me.employeeCode}
          </p>
        </div>
        <div className="ml-auto flex-shrink-0">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            me.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
            me.status === 'PROBATION' ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            {STATUS_LABELS[me.status]}
          </span>
        </div>
      </div>

      <Section title="Thông tin cơ bản">
        <Field label="Họ và tên"      value={me.fullName} />
        <Field label="Mã cán bộ"      value={me.employeeCode} />
        <Field label="Email"           value={me.email} />
        <Field label="Số điện thoại"  value={me.phone} />
        <Field label="Giới tính"      value={me.gender ? GENDER_LABELS[me.gender] : undefined} />
        <Field label="Ngày sinh"       value={me.dateOfBirth ? format(new Date(me.dateOfBirth), 'dd/MM/yyyy') : undefined} />
        <Field label="Dân tộc"        value={me.ethnicity} />
        <Field label="Tôn giáo"       value={me.religion} />
      </Section>

      <Section title="Công tác">
        <Field label="Phòng ban / Khoa"  value={me.department?.name} />
        <Field label="Chức vụ"           value={me.position} />
        <Field label="Ngày vào làm"      value={me.joinDate ? format(new Date(me.joinDate), 'dd/MM/yyyy') : undefined} />
        <Field label="Loại hợp đồng"     value={CONTRACT_TYPE_LABELS[me.contractType]} />
        <Field label="Trình độ"          value={me.educationLevel} />
      </Section>

      <Section title="Địa chỉ">
        <Field label="Quê quán"   value={me.hometown} />
        <Field label="Địa chỉ"   value={me.address} />
      </Section>

      <p className="text-xs text-gray-400 text-center pb-2">
        Để cập nhật thông tin, vui lòng liên hệ Phòng Tổ chức cán bộ.
      </p>
    </div>
  )
}
