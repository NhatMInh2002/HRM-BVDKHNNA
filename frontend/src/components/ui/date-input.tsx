import { forwardRef } from 'react'

/** yyyy-mm-dd (giá trị input[type=date]) → dd/mm/yyyy hiển thị */
function toDisplay(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return ''
  const [y, m, d] = value.split('-')
  return `${d}/${m}/${y}`
}

interface DateInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  value?: string
}

/**
 * input[type=date] hiển thị theo locale trình duyệt (thường ra mm/dd/yyyy) —
 * component này giữ nguyên input gốc (native picker, giá trị ISO cho form)
 * nhưng phủ text hiển thị dd/mm/yyyy lên trên, không phụ thuộc locale máy user.
 */
export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  function DateInput({ value, className = '', ...props }, ref) {
    return (
      <div className="relative">
        <input
          ref={ref}
          type="date"
          value={value}
          {...props}
          className={`${className} text-transparent caret-transparent`}
        />
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm">
          {value ? (
            <span className="text-gray-800">{toDisplay(value)}</span>
          ) : (
            <span className="text-gray-400">dd/mm/yyyy</span>
          )}
        </span>
      </div>
    )
  }
)
