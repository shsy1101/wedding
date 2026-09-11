import { invitation } from './config'

export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // Continue to the selection fallback.
  }

  try {
    const input = document.createElement('textarea')
    input.value = text
    input.setAttribute('readonly', '')
    input.style.position = 'fixed'
    input.style.opacity = '0'
    document.body.appendChild(input)
    input.select()
    const copied = document.execCommand('copy')
    input.remove()
    return copied
  } catch {
    return false
  }
}

export async function shareInvitation(): Promise<string> {
  const data = {
    title: invitation.share.title,
    text: `${invitation.wedding.date.display} · ${invitation.wedding.venue.name} ${invitation.wedding.venue.hall}`,
    url: window.location.href,
  }

  if (navigator.share) {
    try {
      await navigator.share(data)
      return '공유 창을 열었습니다.'
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return ''
    }
  }

  const copied = await copyText(window.location.href)
  return copied ? '초대장 링크를 복사했습니다.' : '주소창의 링크를 복사해 주세요.'
}

export function downloadCalendar(): void {
  const { couple, wedding } = invitation
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Wedding Invitation//KO',
    'BEGIN:VEVENT',
    'UID:20261101T140000-wedding-invitation',
    'DTSTAMP:20260726T000000Z',
    'DTSTART;TZID=Asia/Seoul:20261101T140000',
    'DTEND;TZID=Asia/Seoul:20261101T160000',
    `SUMMARY:${couple.groom.name} ♥ ${couple.bride.name} 결혼식`,
    `LOCATION:${wedding.venue.name} ${wedding.venue.hall}\\, ${wedding.venue.address}`,
    `DESCRIPTION:${couple.groom.name}과 ${couple.bride.name}의 결혼식에 초대합니다.`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${couple.groom.shortName}-${couple.bride.shortName}-결혼식.ics`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
