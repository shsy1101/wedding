import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { calendarDays, invitation } from './config'

export type GalleryImage = {
  src: string
  alt: string
}

export function CalendarGrid() {
  return (
    <table className="calendar-grid" aria-label="2026년 11월 달력">
      <caption>2026 · 11</caption>
      <thead>
        <tr>{['일', '월', '화', '수', '목', '금', '토'].map((day) => <th key={day} scope="col">{day}</th>)}</tr>
      </thead>
      <tbody>
        {Array.from({ length: 5 }, (_, week) => (
          <tr key={week}>
            {calendarDays.slice(week * 7, week * 7 + 7).map((day, index) => (
              <td key={`${week}-${index}`} className={day === 1 ? 'is-wedding-day' : ''}>
                {day === 1 ? <time dateTime={invitation.wedding.date.dateOnly} aria-label="11월 1일 예식일">1</time> : day}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function Reveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      element.dataset.visible = 'true'
      return
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        element.dataset.visible = 'true'
        observer.disconnect()
      }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return <div ref={ref} className={`reveal ${className}`} style={{ '--reveal-delay': `${delay}ms` } as CSSProperties}>{children}</div>
}

export function Toast({ message }: { message: string }) {
  return <div className="toast" role="status" aria-live="polite" data-show={Boolean(message)}>{message}</div>
}

export function useToast() {
  const [message, setMessage] = useState('')
  const timeout = useRef<number | undefined>(undefined)

  function show(nextMessage: string) {
    if (!nextMessage) return
    window.clearTimeout(timeout.current)
    setMessage(nextMessage)
    timeout.current = window.setTimeout(() => setMessage(''), 2600)
  }

  useEffect(() => () => window.clearTimeout(timeout.current), [])
  return { message, show }
}

export function GalleryGrid({ images, open, onSelect, onClose }: {
  images: GalleryImage[]
  open: boolean
  onSelect: (index: number) => void
  onClose: () => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog ref={dialogRef} className="gallery-grid-view" aria-labelledby={titleId} onClose={onClose}>
      {open && (
        <>
          <header className="gallery-grid-view__header">
            <p>PHOTO ARCHIVE · {String(images.length).padStart(2, '0')}</p>
            <h2 id={titleId}>사진 전체 보기</h2>
            <button type="button" onClick={onClose}>닫기</button>
          </header>
          <div className="gallery-grid-view__grid">
            {images.map((image, index) => (
              <button type="button" onClick={() => { dialogRef.current?.close(); onSelect(index) }} aria-label={`${index + 1}번 사진 크게 보기`} key={index}>
                <img src={image.src} alt="" loading="lazy" />
                <span>{String(index + 1).padStart(2, '0')}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </dialog>
  )
}

export function GalleryViewer({ images, index, returnFocus, onIndexChange, onClose }: {
  images: GalleryImage[]
  index: number | null
  returnFocus?: { readonly current: HTMLElement | null }
  onIndexChange: (index: number) => void
  onClose: () => void
}) {
  const titleId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)
  const railRef = useRef<HTMLDivElement>(null)
  const thumbsRef = useRef<HTMLDivElement>(null)
  const previousFocus = useRef<HTMLElement | null>(null)
  const isOpen = index !== null

  useLayoutEffect(() => {
    if (!isOpen || index === null || !railRef.current) return
    railRef.current.scrollLeft = railRef.current.clientWidth * index
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    previousFocus.current = document.activeElement as HTMLElement
    const oldOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      document.body.style.overflow = oldOverflow
      const focusTarget = returnFocus?.current ?? previousFocus.current
      focusTarget?.focus()
    }
  }, [isOpen])

  useEffect(() => {
    if (index === null) return
    const strip = thumbsRef.current
    const thumb = strip?.querySelector<HTMLElement>(`[data-thumb-index="${index}"]`)
    if (!strip || !thumb) return
    strip.scrollTo({
      left: thumb.offsetLeft - (strip.clientWidth - thumb.clientWidth) / 2,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    })
  }, [index])

  useEffect(() => {
    if (!isOpen || index === null) return
    const currentIndex = index
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowLeft') show((currentIndex - 1 + images.length) % images.length)
      if (event.key === 'ArrowRight') show((currentIndex + 1) % images.length)
      if (event.key === 'Tab') {
        const dialog = document.querySelector<HTMLElement>('[data-gallery-dialog]')
        const controls = dialog?.querySelectorAll<HTMLElement>('button')
        if (!controls?.length) return
        const first = controls[0]
        const last = controls[controls.length - 1]
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [images.length, index, isOpen, onClose, onIndexChange])

  if (index === null) return null

  function show(nextIndex: number) {
    const rail = railRef.current
    if (!rail) return
    rail.scrollTo({
      left: rail.clientWidth * nextIndex,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    })
  }

  function updateIndex() {
    const rail = railRef.current
    if (!rail) return
    const nextIndex = Math.round(rail.scrollLeft / rail.clientWidth)
    if (nextIndex !== index && images[nextIndex]) onIndexChange(nextIndex)
  }

  return (
    <div className="viewer" role="dialog" aria-modal="true" aria-labelledby={titleId} data-gallery-dialog>
      <button className="viewer__backdrop" onClick={onClose} aria-label="사진 닫기" />
      <div className="viewer__stage">
        <p className="viewer__title" id={titleId}>{index + 1} / {images.length}</p>
        <div ref={railRef} className="viewer__rail" onScroll={updateIndex}>
          {images.map((image, imageIndex) => (
            <div className="viewer__slide" data-active={imageIndex === index} key={imageIndex}>
              <img src={image.src} alt={image.alt} draggable="false" />
            </div>
          ))}
        </div>
        <button ref={closeRef} className="viewer__close" onClick={onClose} aria-label="사진 닫기">닫기</button>
        <button className="viewer__nav viewer__nav--prev" onClick={() => show((index - 1 + images.length) % images.length)} aria-label="이전 사진">‹</button>
        <button className="viewer__nav viewer__nav--next" onClick={() => show((index + 1) % images.length)} aria-label="다음 사진">›</button>
        <div ref={thumbsRef} className="viewer__thumbs" role="group" aria-label="사진 미리보기">
          {images.map((image, imageIndex) => (
            <button
              type="button"
              className="viewer__thumb"
              data-active={imageIndex === index}
              data-thumb-index={imageIndex}
              aria-current={imageIndex === index ? 'true' : undefined}
              aria-label={`${imageIndex + 1}번째 사진 보기`}
              onClick={() => show(imageIndex)}
              key={imageIndex}
            >
              <img src={image.src} alt="" draggable="false" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export function Icon({ name }: { name: 'calendar' | 'map' | 'copy' | 'share' }) {
  const paths = {
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
    map: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Z"/><path d="M9 3v15M15 6v15"/></>,
    copy: <><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></>,
    share: <><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4"/></>,
  }
  return <svg className="icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
}
