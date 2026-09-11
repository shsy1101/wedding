import { useEffect, useRef, useState } from 'react'
import hero from './assets/hero.jpg'
import heroSmall from './assets/hero-small.jpg'
import kakaoMapIcon from './assets/maps/kakao.png'
import naverMapIcon from './assets/maps/naver.png'
import tmapIcon from './assets/maps/tmap.png'
import { copyText, downloadCalendar, shareInvitation } from './actions'
import { CalendarGrid, GalleryGrid, GalleryViewer, Icon, Reveal, Toast, useToast } from './components'
import Guestbook from './Guestbook'
import Rsvp from './Rsvp'
import { invitation, kakaoMapUrl, naverMapUrl, tmapAndroidMapUrl, tmapIosMapUrl } from './config'

const tmapMapUrl = /iPhone|iPad|iPod/.test(navigator.userAgent) ? tmapIosMapUrl : tmapAndroidMapUrl

const gallery = Object.entries(import.meta.glob<string>('./assets/gallery/*.{jpg,jpeg,png,webp,avif}', {
  eager: true,
  query: '?url',
  import: 'default',
}))
  .sort(([left], [right]) => left.localeCompare(right, undefined, { numeric: true }))
  .map(([path, src], index) => ({
    filename: path.split('/').pop(),
    src,
    alt: `${invitation.couple.groom.shortName}과 ${invitation.couple.bride.shortName}의 결혼 사진 ${index + 1}`,
  }))

type GalleryView = { grid: boolean; index: number | null }

function readGalleryView(): GalleryView {
  const view = window.history.state?.invitationGallery
  return {
    grid: view?.grid === true,
    index: Number.isInteger(view?.index) && gallery[view.index] ? view.index : null,
  }
}

export default function App() {
  const [galleryView, setGalleryView] = useState(readGalleryView)
  const { grid: galleryGridOpen, index: viewerIndex } = galleryView
  const closingGallery = useRef(false)

  useEffect(() => {
    function restoreGallery() {
      closingGallery.current = false
      setGalleryView(readGalleryView())
    }
    window.addEventListener('popstate', restoreGallery)
    return () => window.removeEventListener('popstate', restoreGallery)
  }, [])

  function navigateGallery(next: GalleryView, replace = false) {
    // Ignore late photo-scroll events once Back has left the viewer's history entry.
    if (closingGallery.current || (replace && readGalleryView().index === null)) return
    window.history[replace ? 'replaceState' : 'pushState']({ ...window.history.state, invitationGallery: next }, '')
    setGalleryView(next)
  }

  function closeGallery() {
    if (closingGallery.current) return
    closingGallery.current = true
    window.history.back()
  }
  const toast = useToast()
  const { couple, wedding, accounts } = invitation
  const visibleGallery = invitation.gallery.previewFiles
    .map(filename => gallery.find(image => image.filename === filename))
    .filter(image => image !== undefined)

  async function copyAccount(account: (typeof invitation.accounts)[number]['entries'][number]) {
    const copied = await copyText(`${account.bank} ${account.number} ${account.holder}`)
    toast.show(copied ? `${account.holder} 님의 계좌번호를 복사했습니다.` : '복사하지 못했습니다. 다시 시도해 주세요.')
  }

  return (
    <div className="letter-shell">
      <header className="cover" aria-labelledby="cover-title">
        <div className="cover__folio" aria-hidden="true">A LETTER · 01</div>
        <div className="cover__heading">
          <p className="cover__eyebrow">우리 결혼합니다</p>
          <h1 id="cover-title"><span>{couple.groom.name}</span><i>&amp;</i><span>{couple.bride.name}</span></h1>
        </div>
        <figure className="cover__figure">
          <img src={hero} srcSet={`${heroSmall} 800w, ${hero} 1200w`} sizes="(max-width: 600px) 100vw, 588px" alt={`푸른 하늘 아래 함께 선 ${couple.groom.name}과 ${couple.bride.name}`} width="1200" height="1800" fetchPriority="high" />
          <figcaption>01 · NOVEMBER · 2026</figcaption>
        </figure>
        <div className="cover__facts">
          <p>{wedding.date.display}</p>
          <p>{wedding.venue.name}<br />{wedding.venue.hall}</p>
        </div>
        <a className="cover__scroll" href="#invitation">초대의 글 <span aria-hidden="true">↓</span></a>
      </header>

      <main>
        <section className="letter section-pad" id="invitation" aria-labelledby="invitation-title">
          <Reveal>
            <p className="kicker">INVITATION</p>
            <h2 id="invitation-title">소중한 당신께</h2>
          </Reveal>
          <Reveal className="letter__copy" delay={100}>
            {wedding.greeting.map((line, index) => <p key={line} className={index === 3 ? 'letter__new-stanza' : ''}>{line}</p>)}
          </Reveal>
          <Reveal className="letter__signature" delay={160}>
            <span>{couple.groom.shortName}</span><i>그리고</i><span>{couple.bride.shortName}</span>
          </Reveal>
        </section>

        <section className="family section-pad" aria-labelledby="family-title">
          <Reveal>
            <div className="section-index">02 / OUR FAMILIES</div>
            <h2 id="family-title" className="sr-only">신랑·신부와 양가 부모님 소개</h2>
            <div className="family__line">
              <p><strong>{couple.groom.parents.join(' · ')}</strong><span>의 {couple.groom.relation}</span></p>
              <div className="family__person"><span>신랑</span><b>{couple.groom.name}</b></div>
            </div>
            <div className="family__line">
              <p><strong>{couple.bride.parents.join(' · ')}</strong><span>의 {couple.bride.relation}</span></p>
              <div className="family__person"><span>신부</span><b>{couple.bride.name}</b></div>
            </div>
          </Reveal>
        </section>

        <section className="date-section section-pad" aria-labelledby="date-title">
          <Reveal className="date-section__intro">
            <p className="kicker">THE DAY</p>
            <h2 id="date-title"><span>2026</span>11월의 첫날</h2>
            <p>{wedding.date.display}<br />{wedding.venue.name} {wedding.venue.hall}</p>
          </Reveal>
          <Reveal className="date-section__calendar" delay={100}>
            <CalendarGrid />
            <button className="text-action" type="button" onClick={() => { downloadCalendar(); toast.show('캘린더 파일을 저장했습니다.') }}>
              <Icon name="calendar" /> 캘린더에 저장
            </button>
          </Reveal>
        </section>

        <section className="photo-essay" aria-labelledby="gallery-title">
          <Reveal className="photo-essay__heading">
            <span>03</span><h2 id="gallery-title">두 사람의 장면들</h2><p>사진을 누르면 크게 볼 수 있습니다.</p>
          </Reveal>
          <div className="photo-essay__grid">
            {visibleGallery.map((image, index) => (
              <Reveal className={`photo-essay__item item-${index + 1}`} delay={(index % 2) * 90} key={image.src}>
                <button type="button" onClick={(event) => { event.currentTarget.focus({ preventScroll: true }); navigateGallery({ grid: false, index: gallery.indexOf(image) }) }} aria-label={`${index + 1}번 사진 크게 보기`}>
                  <img src={image.src} alt={image.alt} loading="lazy" />
                </button>
                <span>SCENE {String(index + 1).padStart(2, '0')}</span>
              </Reveal>
            ))}
          </div>
          {visibleGallery.length < gallery.length && (
            <button className="photo-essay__more" type="button" aria-haspopup="dialog" onClick={(event) => { event.currentTarget.focus({ preventScroll: true }); navigateGallery({ grid: true, index: null }) }}>
              사진 전체 보기 <span aria-hidden="true">{gallery.length}</span>
            </button>
          )}
        </section>

        <section className="venue section-pad" aria-labelledby="venue-title">
          <Reveal>
            <p className="kicker">LOCATION</p>
            <h2 id="venue-title">오시는 길</h2>
            <div className="venue__name"><strong>{wedding.venue.name}</strong><span>{wedding.venue.hall}</span></div>
            <address>{wedding.venue.address}</address>
            <p className="venue__transit">{wedding.venue.transport}</p>
            <nav className="venue__links" aria-label="지도 서비스">
              <a href={naverMapUrl} target="_blank" rel="noreferrer" aria-label="네이버 지도에서 주소 보기"><img src={naverMapIcon} alt="" />네이버</a>
              <a href={kakaoMapUrl} target="_blank" rel="noreferrer" aria-label="카카오맵에서 주소 보기"><img src={kakaoMapIcon} alt="" />카카오</a>
              <a href={tmapMapUrl} aria-label="티맵에서 주소 보기"><img src={tmapIcon} alt="" />티맵</a>
            </nav>
          </Reveal>
        </section>

        <Rsvp notify={toast.show} />
        <Guestbook notify={toast.show} />

        <section className="closing section-pad" aria-labelledby="closing-title">
          <Reveal>
            <p className="kicker">WITH GRATITUDE</p>
            <h2 id="closing-title">축하의 마음을<br />오래 간직하겠습니다.</h2>
            {accounts.map((group) => (
              <details className="account" key={group.label}>
                <summary>{group.label} 마음 전하실 곳</summary>
                {group.entries.map((account) => (
                  <div className="account__body" key={account.label}>
                    <p><span><small>{account.label}</small> {account.holder}</span><small>{account.bank} {account.number}</small></p>
                    <button type="button" onClick={() => copyAccount(account)} aria-label={`${account.label} ${account.holder} 계좌번호 복사`}><Icon name="copy" /> 복사</button>
                  </div>
                ))}
              </details>
            ))}
            <button className="share-action" type="button" onClick={async () => toast.show(await shareInvitation())}><Icon name="share" /> 초대장 공유하기</button>
          </Reveal>
          <p className="closing__names">{couple.groom.shortName} <i>&amp;</i> {couple.bride.shortName}</p>
        </section>
      </main>

      <GalleryGrid
        images={gallery}
        open={galleryGridOpen}
        onSelect={(index) => navigateGallery({ grid: true, index })}
        onClose={closeGallery}
      />
      {viewerIndex !== null && (
        <GalleryViewer images={gallery} index={viewerIndex} onIndexChange={(index) => navigateGallery({ grid: galleryGridOpen, index }, true)} onClose={closeGallery} />
      )}
      <Toast message={toast.message} />
    </div>
  )
}
