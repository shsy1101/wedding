import { type FormEvent, useEffect, useId, useRef, useState } from 'react'
import { Reveal } from './components'
import { supabaseRequest } from './supabase'

export default function Rsvp({ notify }: { notify: (message: string) => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const openButtonRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  const [attending, setAttending] = useState<boolean | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const errorRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    if (error) errorRef.current?.focus()
  }, [error])

  function restoreFocus() {
    window.setTimeout(() => openButtonRef.current?.focus(), 0)
  }

  function close() {
    if (submitting) return
    dialogRef.current?.close()
    restoreFocus()
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    if (data.get('website')) return

    const willAttend = data.get('attending') === 'yes'
    const message = String(data.get('message')).trim()
    setError('')
    setSubmitting(true)

    try {
      await supabaseRequest('rsvp', {
        method: 'POST',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({
          name: String(data.get('name')).trim(),
          side: data.get('side'),
          attending: willAttend,
          party_size: willAttend ? Number(data.get('party_size')) : 1,
          meal_type: willAttend ? data.get('meal_type') : 'undecided',
          message: message || null,
        }),
      })
      form.reset()
      setAttending(null)
      dialogRef.current?.close()
      restoreFocus()
      notify('참석 여부를 전달했습니다.')
    } catch (error) {
      setError(error instanceof DOMException && error.name === 'TimeoutError'
        ? '응답 시간이 초과되어 전달 여부를 확인하지 못했습니다. 중복 제출을 피하려면 신랑·신부에게 확인해 주세요.'
        : '참석 여부를 전달하지 못했습니다. 다시 시도해 주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="rsvp section-pad" aria-labelledby="rsvp-title">
      <Reveal>
        <p className="kicker">RSVP</p>
        <h2 id="rsvp-title">참석 여부를 알려 주세요</h2>
        <p>예식과 식사를 정성껏 준비할 수 있도록 참석 여부를 알려 주시면 감사하겠습니다.</p>
        <button ref={openButtonRef} type="button" onClick={() => dialogRef.current?.showModal()}>참석 여부 전달하기</button>
      </Reveal>

      <dialog
        ref={dialogRef}
        className="rsvp-dialog"
        aria-labelledby={titleId}
        onCancel={(event) => { event.preventDefault(); close() }}
        onClick={(event) => { if (event.target === event.currentTarget) close() }}
      >
        <header>
          <div><p>RSVP</p><h2 id={titleId}>참석 여부 전달</h2></div>
          <button type="button" onClick={close} disabled={submitting} aria-label="참석 여부 입력 창 닫기"><span aria-hidden="true">×</span></button>
        </header>

        <form onSubmit={submit}>
          <label className="rsvp-dialog__field">성함<input name="name" required maxLength={40} autoComplete="name" placeholder="성함을 입력해 주세요" /></label>

          <fieldset>
            <legend>구분</legend>
            <div className="rsvp-dialog__options">
              <label><input type="radio" name="side" value="groom" required /><span>신랑 측</span></label>
              <label><input type="radio" name="side" value="bride" /><span>신부 측</span></label>
            </div>
          </fieldset>

          <fieldset>
            <legend>참석 여부</legend>
            <div className="rsvp-dialog__options">
              <label><input type="radio" name="attending" value="yes" required onChange={() => setAttending(true)} /><span>참석</span></label>
              <label><input type="radio" name="attending" value="no" onChange={() => setAttending(false)} /><span>불참</span></label>
            </div>
          </fieldset>

          <div className="rsvp-dialog__attendance" data-disabled={attending !== true}>
            <label className="rsvp-dialog__field">참석 인원
              <select name="party_size" defaultValue="1" disabled={attending !== true}>
                {Array.from({ length: 10 }, (_, index) => <option value={index + 1} key={index + 1}>{index + 1}명</option>)}
              </select>
            </label>
            <label className="rsvp-dialog__field">식사 여부
              <select name="meal_type" required={attending === true} defaultValue="" disabled={attending !== true}>
                <option value="" disabled>선택해 주세요</option>
                <option value="yes">식사 예정</option>
                <option value="no">식사 안 함</option>
                <option value="undecided">미정</option>
              </select>
            </label>
          </div>
          {attending !== true && <p className="rsvp-dialog__hint">참석을 선택하면 인원과 식사 여부를 입력할 수 있습니다.</p>}

          <label className="rsvp-dialog__field"><span>전달사항 <small>(선택)</small></span>
            <textarea name="message" maxLength={500} rows={3} />
          </label>

          <div className="rsvp-dialog__consent">
            <label><input type="checkbox" required /> 개인정보 수집 및 이용 동의 <strong>(필수)</strong></label>
            <p>수집 항목: 성함, 구분, 참석 여부, 참석 인원, 식사 여부<br />이용 목적: 예식 참석 여부 및 식사 인원 확인<br />보유 기간: 2026년 12월 1일까지</p>
          </div>

          <label className="rsvp-dialog__website" aria-hidden="true">웹사이트<input name="website" tabIndex={-1} autoComplete="off" /></label>
          {error && <p ref={errorRef} className="rsvp-dialog__error" role="alert" tabIndex={-1}>{error}</p>}
          <button className="rsvp-dialog__submit" type="submit" disabled={submitting}>{submitting ? '전달하는 중…' : '참석 여부 전달하기'}</button>
        </form>
      </dialog>
    </section>
  )
}
