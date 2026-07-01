'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

/**
 * Hiển thị ảnh từ endpoint cần xác thực (VD /api/files/view?key=...).
 * Thẻ <img> gốc không gửi được Authorization header, nên phải fetch kèm token
 * rồi tạo blob URL. Nếu src đã là data:/blob: (preview cục bộ) thì dùng thẳng.
 */
export function AuthImage({
  src, alt, className, fallback,
}: {
  src?: string | null
  alt: string
  className?: string
  fallback?: React.ReactNode
}) {
  const { data: session } = useSession()
  const token = (session as any)?.accessToken as string | undefined
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  const isDirect = !!src && (src.startsWith('data:') || src.startsWith('blob:'))

  useEffect(() => {
    setFailed(false)
    if (!src || isDirect) { setBlobUrl(null); return }

    let revoked = false
    let currentUrl: string | null = null
    const controller = new AbortController()

    fetch(src, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      signal: controller.signal,
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.blob()
      })
      .then(blob => {
        if (revoked) return
        currentUrl = URL.createObjectURL(blob)
        setBlobUrl(currentUrl)
      })
      .catch(() => { if (!revoked) setFailed(true) })

    return () => {
      revoked = true
      controller.abort()
      if (currentUrl) URL.revokeObjectURL(currentUrl)
    }
  }, [src, token, isDirect])

  const finalSrc = isDirect ? src : blobUrl

  if (!src || failed) return <>{fallback ?? null}</>
  if (!finalSrc) return <>{fallback ?? null}</>

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={finalSrc} alt={alt} className={className} />
}
