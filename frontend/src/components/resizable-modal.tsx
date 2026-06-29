'use client'
import { useRef, useState, useCallback, useEffect } from 'react'

interface ResizableModalProps {
  children: React.ReactNode
  onClose: () => void
  defaultWidth?: number
  defaultHeight?: number
  minWidth?: number
  minHeight?: number
  title?: string
  className?: string
}

type ResizeDir = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw' | null

const CURSOR_MAP: Record<NonNullable<ResizeDir>, string> = {
  n: 'ns-resize', s: 'ns-resize',
  e: 'ew-resize', w: 'ew-resize',
  ne: 'nesw-resize', sw: 'nesw-resize',
  nw: 'nwse-resize', se: 'nwse-resize',
}

export function ResizableModal({
  children,
  onClose,
  defaultWidth = 860,
  defaultHeight = 600,
  minWidth = 420,
  minHeight = 300,
}: ResizableModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  // Position + size state
  const [size, setSize] = useState({ w: defaultWidth, h: defaultHeight })
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null) // null = centered via CSS

  // Drag state refs (avoid re-renders during drag)
  const drag = useRef<{
    resizeDir: ResizeDir
    startX: number; startY: number
    startW: number; startH: number
    startPosX: number; startPosY: number
    moving: boolean
    offsetX: number; offsetY: number
  } | null>(null)

  // Center on first render
  useEffect(() => {
    const vw = window.innerWidth
    const vh = window.innerHeight
    setPos({
      x: Math.max(0, (vw - defaultWidth) / 2),
      y: Math.max(0, (vh - defaultHeight) / 2),
    })
  }, [defaultWidth, defaultHeight])

  // ── Resize handles ────────────────────────────────────────────────────────

  const startResize = useCallback((e: React.MouseEvent, dir: ResizeDir) => {
    e.preventDefault()
    e.stopPropagation()
    const rect = modalRef.current!.getBoundingClientRect()
    drag.current = {
      resizeDir: dir,
      startX: e.clientX, startY: e.clientY,
      startW: rect.width, startH: rect.height,
      startPosX: rect.left, startPosY: rect.top,
      moving: false, offsetX: 0, offsetY: 0,
    }
    document.body.style.userSelect = 'none'
    document.body.style.cursor = CURSOR_MAP[dir!]
  }, [])

  // ── Move (drag header) ────────────────────────────────────────────────────

  const startMove = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return
    e.preventDefault()
    const rect = modalRef.current!.getBoundingClientRect()
    drag.current = {
      resizeDir: null,
      startX: e.clientX, startY: e.clientY,
      startW: rect.width, startH: rect.height,
      startPosX: rect.left, startPosY: rect.top,
      moving: true,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    }
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'grabbing'
  }, [])

  // ── Global mouse move / up ────────────────────────────────────────────────

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const d = drag.current
      if (!d) return
      const dx = e.clientX - d.startX
      const dy = e.clientY - d.startY

      if (d.moving) {
        const vw = window.innerWidth
        const vh = window.innerHeight
        setPos({
          x: Math.max(0, Math.min(vw - d.startW, e.clientX - d.offsetX)),
          y: Math.max(0, Math.min(vh - d.startH, e.clientY - d.offsetY)),
        })
        return
      }

      const dir = d.resizeDir
      if (!dir) return

      let newW = d.startW
      let newH = d.startH
      let newX = d.startPosX
      let newY = d.startPosY

      if (dir.includes('e')) newW = Math.max(minWidth, d.startW + dx)
      if (dir.includes('s')) newH = Math.max(minHeight, d.startH + dy)
      if (dir.includes('w')) {
        const delta = Math.min(dx, d.startW - minWidth)
        newW = d.startW - delta
        newX = d.startPosX + delta
      }
      if (dir.includes('n')) {
        const delta = Math.min(dy, d.startH - minHeight)
        newH = d.startH - delta
        newY = d.startPosY + delta
      }

      setSize({ w: newW, h: newH })
      if (dir.includes('w') || dir.includes('n')) {
        setPos({ x: newX, y: newY })
      }
    }

    const onUp = () => {
      drag.current = null
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [minWidth, minHeight])

  // ── Close on backdrop click ───────────────────────────────────────────────

  const onBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  if (!pos) return null // wait for centering

  const EDGE = 6   // px edge hit zone
  const CORNER = 14

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50"
      onClick={onBackdropClick}
    >
      <div
        ref={modalRef}
        style={{
          position: 'fixed',
          left: pos.x,
          top: pos.y,
          width: size.w,
          height: size.h,
          minWidth,
          minHeight,
        }}
        className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden select-none"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Resize handles ── */}

        {/* Edges */}
        <div onMouseDown={e => startResize(e, 'n')}
          style={{ position:'absolute', top:0, left:CORNER, right:CORNER, height:EDGE, cursor:'ns-resize', zIndex:10 }} />
        <div onMouseDown={e => startResize(e, 's')}
          style={{ position:'absolute', bottom:0, left:CORNER, right:CORNER, height:EDGE, cursor:'ns-resize', zIndex:10 }} />
        <div onMouseDown={e => startResize(e, 'w')}
          style={{ position:'absolute', left:0, top:CORNER, bottom:CORNER, width:EDGE, cursor:'ew-resize', zIndex:10 }} />
        <div onMouseDown={e => startResize(e, 'e')}
          style={{ position:'absolute', right:0, top:CORNER, bottom:CORNER, width:EDGE, cursor:'ew-resize', zIndex:10 }} />

        {/* Corners */}
        <div onMouseDown={e => startResize(e, 'nw')}
          style={{ position:'absolute', top:0, left:0, width:CORNER, height:CORNER, cursor:'nwse-resize', zIndex:11 }} />
        <div onMouseDown={e => startResize(e, 'ne')}
          style={{ position:'absolute', top:0, right:0, width:CORNER, height:CORNER, cursor:'nesw-resize', zIndex:11 }} />
        <div onMouseDown={e => startResize(e, 'sw')}
          style={{ position:'absolute', bottom:0, left:0, width:CORNER, height:CORNER, cursor:'nesw-resize', zIndex:11 }} />
        <div onMouseDown={e => startResize(e, 'se')}
          style={{ position:'absolute', bottom:0, right:0, width:CORNER, height:CORNER, cursor:'nwse-resize', zIndex:11 }}>
          {/* Visual grip dots at bottom-right */}
          <svg width={CORNER} height={CORNER} className="absolute bottom-0 right-0 text-gray-300 opacity-60">
            <circle cx="10" cy="10" r="1.5" fill="currentColor"/>
            <circle cx="6"  cy="10" r="1.5" fill="currentColor"/>
            <circle cx="10" cy="6"  r="1.5" fill="currentColor"/>
          </svg>
        </div>

        {/* ── Draggable header bar (thin strip at top) ── */}
        <div
          onMouseDown={startMove}
          style={{ position:'absolute', top:EDGE, left:CORNER, right:CORNER, height:40, cursor:'grab', zIndex:9 }}
        />

        {/* ── Content (fills the modal, z above drag strip) ── */}
        <div className="flex flex-col flex-1 min-h-0 relative z-10 pointer-events-auto">
          {children}
        </div>
      </div>
    </div>
  )
}
