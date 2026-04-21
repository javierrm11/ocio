'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import './landing.css'

export default function LandingPage() {
  const photoRef = useRef<HTMLDivElement>(null)
  const copyRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLElement>(null)
  const glowARef = useRef<HTMLDivElement>(null)
  const glowBRef = useRef<HTMLDivElement>(null)
  const glowCRef = useRef<HTMLDivElement>(null)
  const navRef = useRef<HTMLElement>(null)
  const scrollHintRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const photo = photoRef.current
    const copy = copyRef.current
    const hero = heroRef.current
    const glowA = glowARef.current
    const glowB = glowBRef.current
    const glowC = glowCRef.current
    const nav = navRef.current
    const scrollHint = scrollHintRef.current
    if (!photo || !copy || !hero || !glowA || !glowB || !glowC || !nav || !scrollHint) return

    const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t

    function onScroll() {
      if (!hero || !photo || !copy || !glowA || !glowB || !glowC || !nav || !scrollHint) return
      const t = clamp(-hero.getBoundingClientRect().top / (hero.offsetHeight - window.innerHeight), 0, 1)

      nav.classList.toggle('lp-scrolled', window.scrollY > 30)

      photo.style.transform = `translate3d(0,${-t * 80}px,0) scale(${lerp(1.35, 1, t)})`
      photo.style.opacity = String(lerp(1, 0.35, t))
      photo.style.filter = `brightness(${lerp(1, 0.55, t)})`
      copy.style.transform = `translate3d(0,${-t * 100}px,0) scale(${lerp(1, 0.92, t)})`
      copy.style.opacity = String(1 - clamp(t * 1.5, 0, 1))
      glowA.style.transform = `translate3d(${-t * 60}px,${-t * 40}px,0)`
      glowB.style.transform = `translate3d(${t * 80}px,${t * 60}px,0)`
      glowC.style.transform = `translate(-50%,-50%) translate3d(0,${-t * 120}px,0) scale(${1 + t * 0.3})`
      scrollHint.style.opacity = String(1 - clamp(t * 4, 0, 1))
    }

    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => { onScroll(); ticking = false })
        ticking = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    onScroll()
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <div className="lp-root">
      <nav ref={navRef} className="lp-nav">
        <Link className="lp-brand" href="/">
          <span className="lp-brand-mark">
            <Image src="/logo.png" alt="Ozio" width={34} height={34} className="lp-brand-logo" />
          </span>
          <span>Ozio</span>
        </Link>
        <Link className="lp-nav-cta" href="/mapa">Abrir app</Link>
      </nav>

      <section ref={heroRef} className="lp-hero">
        <div className="lp-hero-stage">
          <div ref={photoRef} className="lp-hero-photo" />
          <div ref={glowARef} className="lp-glow lp-a" />
          <div ref={glowBRef} className="lp-glow lp-b" />
          <div ref={glowCRef} className="lp-glow lp-c" />
          <div ref={copyRef} className="lp-hero-copy">
            <div className="lp-pill"><span className="lp-dot" /> Ambiente en tiempo real</div>
            <h1 className="lp-hero-title">
              Descubre dónde<br />
              <span className="lp-grad">está el ambiente</span>
            </h1>
            <p className="lp-hero-sub">
              Consulta el ambiente de bares, restaurantes y locales en tiempo real, haz check-in y encuentra los mejores planes cerca de ti.
            </p>
            <div className="lp-cta-row">
              <Link className="lp-btn lp-btn-primary" href="/mapa">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M3 6 L9 4 L15 6 L21 4 V18 L15 20 L9 18 L3 20 Z M9 4 V18 M15 6 V20" stroke="white" strokeWidth="1.8" strokeLinejoin="round" />
                </svg>
                Abrir la web
              </Link>
              <div className="lp-store-row">
                <button type="button" className="lp-btn lp-btn-store" disabled>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                    <path d="M17.5 12.5c0-2.4 2-3.6 2.1-3.6-1.1-1.6-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9s-2-.9-3.2-.8c-1.7 0-3.2 1-4 2.5-1.7 3-.4 7.4 1.2 9.8.8 1.2 1.8 2.5 3 2.4s1.7-.8 3.1-.8 1.9.8 3.2.8 2.2-1.2 3-2.4c1-1.4 1.4-2.7 1.4-2.8s-2.6-1-2.6-4.1zM15 4.6c.7-.8 1.1-1.9 1-3-1 0-2.1.7-2.8 1.5-.6.7-1.1 1.8-1 2.9 1.1.1 2.2-.5 2.8-1.4z" />
                  </svg>
                  <div className="lp-store-label">
                    <span className="lp-store-soon">Próximamente</span>
                    App Store
                  </div>
                </button>
                <button type="button" className="lp-btn lp-btn-store" disabled>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path d="M4 3 L18 12 L4 21 Z" fill="white" />
                  </svg>
                  <div className="lp-store-label">
                    <span className="lp-store-soon">Próximamente</span>
                    Google Play
                  </div>
                </button>
              </div>
            </div>
          </div>
          <div ref={scrollHintRef} className="lp-scroll-hint">
            <span>Scroll</span>
            <div className="lp-mouse" />
          </div>
        </div>
      </section>

      <section className="lp-features">
        <div className="lp-section-head">
          <div className="lp-eyebrow">Cómo funciona</div>
          <h2 className="lp-section-title">Toda la noche, en un mapa.</h2>
          <p className="lp-section-sub">Tres ingredientes para no volver a llegar a un local vacío ni a perderte el plan que estaba pasando al lado.</p>
        </div>
        <div className="lp-grid-3">
          <div className="lp-feat">
            <div className="lp-feat-icon lp-blue">
              <svg viewBox="0 0 24 24" fill="none"><path d="M12 22s7-7.5 7-13a7 7 0 1 0-14 0c0 5.5 7 13 7 13Z" stroke="currentColor" strokeWidth="1.8" /><circle cx="12" cy="9" r="2.6" stroke="currentColor" strokeWidth="1.8" /></svg>
            </div>
            <h3>Mapa en vivo</h3>
            <p>Visualiza el ambiente de cada local en el mapa. Cuanta más gente, más caliente el marcador.</p>
          </div>
          <div className="lp-feat">
            <div className="lp-feat-icon lp-violet">
              <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" /><path d="M8 12.5l2.5 2.5L16 9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <h3>Check-in real</h3>
            <p>Haz check-in cuando llegues a un local y ayuda a otros a saber dónde está la gente.</p>
          </div>
          <div className="lp-feat">
            <div className="lp-feat-icon lp-orange">
              <svg viewBox="0 0 24 24" fill="none"><rect x="3.5" y="5.5" width="17" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.8" /><path d="M3.5 10h17M8 3.5v4M16 3.5v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
            </div>
            <h3>Eventos</h3>
            <p>Descubre eventos activos y próximas noches especiales en los locales de tu ciudad.</p>
          </div>
        </div>
      </section>

      <section className="lp-map-section">
        <div className="lp-map-wrap">
          <div className="lp-copy">
            <div className="lp-eyebrow">Mapa en vivo</div>
            <h2>El termómetro de tu ciudad después de las 10.</h2>
            <p>Cada marcador refleja el ambiente real reportado por la gente que está allí. Decide tu próxima parada con datos, no con suerte.</p>
            <Link className="lp-btn lp-btn-primary" href="/mapa">Probar el mapa</Link>
            <div className="lp-stat-row">
              <div className="lp-stat"><div className="lp-n">+2,4k</div><div className="lp-l">Locales activos</div></div>
              <div className="lp-stat"><div className="lp-n">38s</div><div className="lp-l">Frecuencia de update</div></div>
              <div className="lp-stat"><div className="lp-n">12</div><div className="lp-l">Ciudades</div></div>
            </div>
          </div>
          <div className="lp-map-card">
            <div className="lp-map-grid" />
            <div className="lp-map-roads">
              <svg viewBox="0 0 400 500" preserveAspectRatio="none">
                <path d="M0,120 C100,140 200,80 400,150" stroke="rgba(255,255,255,0.06)" strokeWidth="22" fill="none" />
                <path d="M0,300 C140,260 260,360 400,310" stroke="rgba(255,255,255,0.06)" strokeWidth="22" fill="none" />
                <path d="M120,0 C140,180 110,340 150,500" stroke="rgba(255,255,255,0.06)" strokeWidth="22" fill="none" />
                <path d="M280,0 C260,180 310,360 270,500" stroke="rgba(255,255,255,0.06)" strokeWidth="22" fill="none" />
              </svg>
            </div>
            <div className="lp-pin lp-hot lp-pin-1"><div className="lp-pulse" /><div className="lp-ring">98°</div></div>
            <div className="lp-pin lp-warm lp-pin-2"><div className="lp-pulse" /><div className="lp-ring">74°</div></div>
            <div className="lp-pin lp-cool lp-pin-3"><div className="lp-pulse" /><div className="lp-ring">42°</div></div>
            <div className="lp-pin lp-warm lp-pin-4"><div className="lp-pulse" /><div className="lp-ring">61°</div></div>
            <div className="lp-pin lp-hot lp-pin-5"><div className="lp-pulse" /><div className="lp-ring">88°</div></div>
            <div className="lp-map-legend">
              <div className="lp-legend-item"><span className="lp-sw lp-sw-low" /> Tranquilo</div>
              <div className="lp-legend-item"><span className="lp-sw lp-sw-mid" /> Animado</div>
              <div className="lp-legend-item"><span className="lp-sw lp-sw-high" /> Lleno</div>
            </div>
          </div>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-foot-wrap">
          <div>© {new Date().getFullYear()} Ozio · Hecho con ☾ para la noche</div>
          <div className="lp-foot-links">
            <a href="#">Privacidad</a>
            <a href="#">Términos</a>
            <a href="#">Contacto</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
