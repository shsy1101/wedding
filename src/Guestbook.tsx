import { type FormEvent, useEffect, useRef, useState } from 'react'
import { Reveal } from './components'
import { supabaseRequest } from './supabase'

type GuestbookEntry = {
  id: number
  name: string
  message: string
  created_at: string
}

const dateFormatter = new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })

async function fetchEntries() {
  const response = await supabaseRequest('guestbook?select=id,name,message,created_at&order=created_at.desc')
  return response.json() as Promise<GuestbookEntry[]>
}

async function addEntry(name: string, password: string, message: string) {
  await supabaseRequest('rpc/add_guestbook_entry', {
    method: 'POST',
    body: JSON.stringify({ p_name: name, p_password: password, p_message: message }),
  })
}

async function deleteEntry(id: number, password: string) {
  const response = await supabaseRequest('rpc/delete_guestbook_entry', {
    method: 'POST',
    body: JSON.stringify({ p_id: id, p_password: password }),
  })
  return response.json() as Promise<boolean>
}

export default function Guestbook({ notify }: { notify: (message: string) => void }) {
  const [entries, setEntries] = useState<GuestbookEntry[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [submitting, setSubmitting] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const writerRef = useRef<HTMLDetailsElement>(null)

  async function load() {
    setStatus('loading')
    try {
      setEntries(await fetchEntries())
      setStatus('ready')
    } catch {
      setStatus('error')
    }
  }

  useEffect(() => { void load() }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    if (data.get('website')) return

    const name = String(data.get('name')).trim()
    const password = String(data.get('password'))
    const message = String(data.get('message')).trim()

    setSubmitting(true)
    try {
      await addEntry(name, password, message)
      form.reset()
      writerRef.current?.removeAttribute('open')
      notify('방명록을 남겼습니다.')
      await load()
    } catch {
      notify('방명록을 남기지 못했습니다. 다시 시도해 주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  async function remove(entry: GuestbookEntry) {
    const password = window.prompt('작성할 때 입력한 비밀번호를 입력해 주세요.')
    if (!password) return
    try {
      if (!await deleteEntry(entry.id, password)) {
        notify('비밀번호가 일치하지 않습니다.')
        return
      }
      setEntries((current) => current.filter(({ id }) => id !== entry.id))
      notify('방명록을 삭제했습니다.')
    } catch {
      notify('방명록을 삭제하지 못했습니다. 다시 시도해 주세요.')
    }
  }

  const visibleEntries = showAll ? entries : entries.slice(0, 5)

  return (
    <section className="guestbook section-pad" aria-labelledby="guestbook-title">
      <Reveal>
        <p className="kicker">GUESTBOOK</p>
        <h2 id="guestbook-title">축하의 말을 남겨 주세요</h2>
        <p className="guestbook__intro">남겨 주신 따뜻한 마음은 두 사람이 오래 간직하겠습니다.</p>
      </Reveal>

      <Reveal className="guestbook__content" delay={100}>
        <div className="guestbook__list" aria-live="polite">
          {status === 'loading' && <p className="guestbook__status">방명록을 불러오는 중입니다.</p>}
          {status === 'error' && <p className="guestbook__status">방명록을 불러오지 못했습니다. <button type="button" onClick={() => void load()}>다시 시도</button></p>}
          {status === 'ready' && entries.length === 0 && <p className="guestbook__status">첫 번째 축하의 말을 남겨 주세요.</p>}
          {status === 'ready' && visibleEntries.map((entry) => (
            <article className="guestbook__entry" key={entry.id}>
              <header><strong>{entry.name}</strong><time dateTime={entry.created_at}>{dateFormatter.format(new Date(entry.created_at))}</time></header>
              <p>{entry.message}</p>
              <button type="button" onClick={() => void remove(entry)} aria-label={`${entry.name}님의 방명록 삭제`}>삭제</button>
            </article>
          ))}
        </div>

        {entries.length > 5 && (
          <button className="guestbook__more" type="button" onClick={() => setShowAll((current) => !current)}>
            {showAll ? '접기' : `더보기 ${entries.length}`}
          </button>
        )}

        <details ref={writerRef} className="guestbook__writer">
          <summary>방명록 작성하기</summary>
          <form onSubmit={submit}>
            <p className="guestbook__guide">비밀번호는 작성한 메시지를 삭제할 때 사용합니다.</p>
            <label>이름<input name="name" required maxLength={20} autoComplete="name" /></label>
            <label>비밀번호<input name="password" type="password" required minLength={4} maxLength={20} autoComplete="new-password" /></label>
            <label className="guestbook__message">메시지<textarea name="message" required maxLength={500} rows={3} /></label>
            <label className="guestbook__website" aria-hidden="true">웹사이트<input name="website" tabIndex={-1} autoComplete="off" /></label>
            <button type="submit" disabled={submitting}>{submitting ? '남기는 중…' : '마음 남기기'}</button>
          </form>
        </details>
      </Reveal>
    </section>
  )
}
