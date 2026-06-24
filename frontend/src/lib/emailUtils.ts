/**
 * Bỏ dấu tiếng Việt, trả về chuỗi ASCII lowercase
 * Dùng Unicode NFD decomposition + loại combining marks
 */
function removeAccents(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // bỏ combining diacritical marks
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
}

/**
 * Sinh email theo quy tắc bệnh viện:
 *   Ngô Quang Nhật Minh → minhnqn@bvnghean.vn
 *   [tên] + [viết tắt họ+đệm theo thứ tự] + @domain
 */
export function generateEmail(fullName: string, domain = 'bvnghean.vn'): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return ''
  if (parts.length === 1) {
    return `${removeAccents(parts[0]).toLowerCase()}@${domain}`
  }

  const ten = removeAccents(parts[parts.length - 1]).toLowerCase()
  const initials = parts
    .slice(0, -1)
    .map(p => removeAccents(p).charAt(0).toLowerCase())
    .join('')

  return `${ten}${initials}@${domain}`
}
