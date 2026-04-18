'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'

const css = `
  .lp-root {
    --bg-0: #070612;
    --bg-1: #0c0a1f;
    --ink-0: #ffffff;
    --ink-1: #b8b3c9;
    --ink-2: #7a7590;
    --line: rgba(255,255,255,0.08);
    --line-strong: rgba(255,255,255,0.14);
    --card: rgba(255,255,255,0.035);
    --card-hover: rgba(255,255,255,0.06);
    --grad: linear-gradient(95deg, #5b6cff 0%, #9a5bff 38%, #d97aff 64%, #ff9a3d 100%);
    background: var(--bg-0);
    color: var(--ink-0);
    font-family: var(--font-geist-sans), system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
    overflow-x: hidden;
    min-height: 100vh;
  }
  .lp-root a { color: inherit; text-decoration: none; }

  /* NAV */
  .lp-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 60;
    display: flex; align-items: center; justify-content: space-between;
    padding: 20px 40px;
    transition: background .35s ease, backdrop-filter .35s ease, border-color .35s ease;
    border-bottom: 1px solid transparent;
  }
  .lp-nav.lp-scrolled {
    background: rgba(7,6,18,0.72);
    backdrop-filter: blur(18px) saturate(140%);
    -webkit-backdrop-filter: blur(18px) saturate(140%);
    border-bottom-color: var(--line);
  }
  .lp-brand { display: flex; align-items: center; gap: 12px; font-weight: 700; font-size: 18px; letter-spacing: -0.01em; }
  .lp-brand-mark {
    width: 34px; height: 34px; border-radius: 50%;
    background: radial-gradient(circle at 30% 30%, #6a78ff 0%, #6a3aff 55%, #2a1480 100%);
    display: grid; place-items: center;
    box-shadow: 0 8px 28px rgba(106,58,255,0.45), inset 0 0 0 1px rgba(255,255,255,0.18);
    overflow: hidden;
  }
  .lp-nav-cta {
    padding: 10px 18px; border-radius: 999px;
    border: 1px solid var(--line-strong); color: var(--ink-0);
    font-size: 14px; font-weight: 500;
    background: rgba(255,255,255,0.03);
    transition: background .2s ease, border-color .2s ease, transform .2s ease;
  }
  .lp-nav-cta:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.25); transform: translateY(-1px); }

  /* HERO */
  .lp-hero { position: relative; height: 120vh; background: var(--bg-0); }
  .lp-hero-stage {
    position: sticky; top: 0;
    height: 100vh; width: 100%;
    overflow: hidden;
    display: grid; place-items: center;
  }
  .lp-hero-photo {
    position: absolute; inset: 0;
    background-image: url('/gemini.png');
    background-size: cover;
    background-position: center 80%;
    will-change: transform, opacity, filter;
    transform-origin: 50% 45%;
  }
  .lp-hero-photo::after {
    content: ""; position: absolute; inset: 0;
    background:
      radial-gradient(120% 80% at 50% 110%, rgba(7,6,18,0.95) 10%, rgba(7,6,18,0.6) 45%, rgba(7,6,18,0.15) 70%, transparent 90%),
      linear-gradient(180deg, rgba(7,6,18,0.45) 0%, rgba(7,6,18,0.25) 30%, rgba(7,6,18,0.55) 70%, rgba(7,6,18,0.95) 100%);
  }
  .lp-glow {
    position: absolute; border-radius: 50%;
    filter: blur(90px); opacity: .55; pointer-events: none;
    will-change: transform, opacity;
  }
  .lp-glow.lp-a { width: 560px; height: 560px; left: -140px; top: -160px; background: radial-gradient(circle, rgba(91,108,255,0.7), transparent 60%); }
  .lp-glow.lp-b { width: 680px; height: 680px; right: -180px; bottom: -220px; background: radial-gradient(circle, rgba(255,154,61,0.55), transparent 60%); }
  .lp-glow.lp-c { width: 520px; height: 520px; left: 50%; top: 50%; transform: translate(-50%,-50%); background: radial-gradient(circle, rgba(154,91,255,0.45), transparent 65%); }

  .lp-hero-copy {
    position: relative; z-index: 5;
    text-align: center; padding: 0 24px; max-width: 980px;
    will-change: transform, opacity;
  }
  .lp-pill {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 7px 14px; border-radius: 999px;
    background: rgba(91,108,255,0.12); border: 1px solid rgba(91,108,255,0.45);
    color: #a9b3ff; font-size: 13px; font-weight: 500; margin-bottom: 24px;
  }
  .lp-dot { width: 6px; height: 6px; border-radius: 50%; background: #5b6cff; box-shadow: 0 0 10px #5b6cff; flex-shrink: 0; }
  h1.lp-hero-title {
    font-family: var(--font-geist-sans), sans-serif;
    font-weight: 800;
    font-size: clamp(46px, 8vw, 110px);
    line-height: 0.98; letter-spacing: -0.035em; margin: 0 0 24px;
  }
  .lp-grad {
    background: var(--grad);
    -webkit-background-clip: text; background-clip: text;
    color: transparent; display: inline-block;
  }
  .lp-hero-sub {
    font-size: clamp(16px, 1.5vw, 19px);
    color: var(--ink-1); line-height: 1.55;
    max-width: 620px; margin: 0 auto 36px;
  }
  .lp-cta-row { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
  .lp-btn {
    display: inline-flex; align-items: center; gap: 10px;
    padding: 14px 22px; border-radius: 14px;
    font-weight: 600; font-size: 15px;
    border: 1px solid var(--line-strong);
    background: rgba(255,255,255,0.04); color: var(--ink-0);
    transition: transform .2s ease, background .2s ease, border-color .2s ease;
    font-family: var(--font-geist-sans), sans-serif; cursor: pointer;
  }
  .lp-btn:hover { transform: translateY(-2px); background: rgba(255,255,255,0.08); }
  .lp-btn:disabled { opacity: .5; cursor: not-allowed; transform: none; }
  .lp-soft { font-size: 11px; padding: 3px 7px; border-radius: 6px; background: rgba(255,255,255,0.08); color: var(--ink-2); font-weight: 500; }
  .lp-btn-primary {
    background: linear-gradient(95deg, #5b6cff, #9a5bff 60%, #c468ff);
    border-color: transparent;
    box-shadow: 0 14px 40px rgba(106,58,255,0.45), inset 0 1px 0 rgba(255,255,255,0.25);
  }
  .lp-btn-primary:hover { filter: brightness(1.06); transform: translateY(-2px); }

  .lp-scroll-hint {
    position: absolute; bottom: 28px; left: 50%; transform: translateX(-50%);
    display: flex; flex-direction: column; align-items: center; gap: 8px;
    color: var(--ink-2); font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; z-index: 6;
  }
  .lp-mouse { width: 22px; height: 34px; border: 1px solid rgba(255,255,255,0.4); border-radius: 14px; position: relative; }
  .lp-mouse::after {
    content: ""; position: absolute; left: 50%; top: 7px;
    width: 3px; height: 7px; border-radius: 2px;
    background: #fff; transform: translateX(-50%);
    animation: lpScrollDot 1.6s ease-in-out infinite;
  }
  @keyframes lpScrollDot {
    0% { transform: translate(-50%, 0); opacity: 1; }
    70% { transform: translate(-50%, 12px); opacity: 0; }
    100% { transform: translate(-50%, 0); opacity: 0; }
  }

  /* FEATURES */
  .lp-features {
    position: relative; z-index: 3;
    padding: 0px 40px 140px;
    background: linear-gradient(180deg, var(--bg-0) 0%, var(--bg-1) 100%);
  }
  .lp-section-head { max-width: 1100px; margin: 0 auto 56px; text-align: center; }
  .lp-eyebrow { font-size: 12px; letter-spacing: 0.22em; text-transform: uppercase; color: var(--ink-2); margin-bottom: 14px; }
  .lp-section-title { font-size: clamp(34px, 4.4vw, 56px); font-weight: 700; letter-spacing: -0.025em; line-height: 1.05; margin: 0 0 14px; }
  .lp-section-sub { color: var(--ink-1); font-size: 17px; line-height: 1.55; max-width: 580px; margin: 0 auto; }
  .lp-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; max-width: 1100px; margin: 0 auto; }
  .lp-feat {
    padding: 26px; border-radius: 18px;
    background: var(--card); border: 1px solid var(--line);
    transition: background .2s ease, border-color .2s ease, transform .2s ease;
  }
  .lp-feat:hover { background: var(--card-hover); border-color: var(--line-strong); transform: translateY(-3px); }
  .lp-feat-icon { width: 42px; height: 42px; border-radius: 12px; display: grid; place-items: center; margin-bottom: 18px; }
  .lp-feat-icon.lp-blue { background: rgba(91,108,255,0.16); color: #a9b3ff; }
  .lp-feat-icon.lp-violet { background: rgba(154,91,255,0.16); color: #c8aaff; }
  .lp-feat-icon.lp-orange { background: rgba(255,154,61,0.14); color: #ffb676; }
  .lp-feat-icon svg { width: 20px; height: 20px; }
  .lp-feat h3 { margin: 0 0 8px; font-size: 18px; font-weight: 600; letter-spacing: -0.01em; }
  .lp-feat p { margin: 0; color: var(--ink-1); font-size: 14.5px; line-height: 1.55; }

  /* MAP SECTION */
  .lp-map-section { padding: 120px 40px; background: var(--bg-1); position: relative; overflow: hidden; }
  .lp-map-wrap { max-width: 1180px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1.15fr; gap: 64px; align-items: center; }
  .lp-map-wrap .lp-copy h2 { font-size: clamp(32px, 3.8vw, 48px); font-weight: 700; letter-spacing: -0.025em; line-height: 1.05; margin: 0 0 18px; }
  .lp-map-wrap .lp-copy p { color: var(--ink-1); font-size: 17px; line-height: 1.6; margin: 0 0 22px; }
  .lp-stat-row { display: flex; gap: 28px; margin-top: 28px; }
  .lp-stat { display: flex; flex-direction: column; gap: 4px; }
  .lp-n { font-size: 28px; font-weight: 700; letter-spacing: -0.02em; }
  .lp-l { font-size: 13px; color: var(--ink-2); }

  .lp-map-card {
    position: relative; border-radius: 24px; overflow: hidden;
    border: 1px solid var(--line);
    background: linear-gradient(160deg, #0e0a26 0%, #1a0f3a 100%);
    aspect-ratio: 4/5;
    box-shadow: 0 30px 80px rgba(0,0,0,0.5);
  }
  .lp-map-grid {
    position: absolute; inset: 0;
    background-image: linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
    background-size: 40px 40px;
  }
  .lp-map-roads { position: absolute; inset: 0; }
  .lp-map-roads svg { width: 100%; height: 100%; }
  .lp-pin { position: absolute; transform: translate(-50%,-50%); }
  .lp-ring {
    width: 38px; height: 38px; border-radius: 50%;
    display: grid; place-items: center;
    color: #fff; font-size: 11px; font-weight: 700;
    box-shadow: 0 6px 22px rgba(0,0,0,0.4);
    border: 2px solid rgba(255,255,255,0.18);
  }
  .lp-pin.lp-hot .lp-ring { background: linear-gradient(135deg, #ff5b8a, #ff9a3d); }
  .lp-pin.lp-warm .lp-ring { background: linear-gradient(135deg, #9a5bff, #ff5bbf); }
  .lp-pin.lp-cool .lp-ring { background: linear-gradient(135deg, #5b6cff, #5bb8ff); }
  .lp-pulse {
    position: absolute; inset: -6px; border-radius: 50%;
    border: 1px solid rgba(255,255,255,0.4);
    animation: lpPulse 2.4s ease-out infinite;
  }
  .lp-pin.lp-hot .lp-pulse { border-color: rgba(255,107,107,0.55); }
  .lp-pin.lp-warm .lp-pulse { border-color: rgba(199,121,255,0.5); }
  .lp-pin.lp-cool .lp-pulse { border-color: rgba(91,184,255,0.5); }
  @keyframes lpPulse {
    0% { transform: scale(0.9); opacity: 0.9; }
    100% { transform: scale(2.2); opacity: 0; }
  }
  .lp-map-legend {
    position: absolute; left: 18px; bottom: 18px;
    display: flex; gap: 12px; padding: 10px 14px;
    background: rgba(7,6,18,0.65); backdrop-filter: blur(12px);
    border: 1px solid var(--line); border-radius: 14px;
    font-size: 12px; color: var(--ink-1);
  }
  .lp-legend-item { display: flex; align-items: center; gap: 6px; }
  .lp-sw { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }

  /* FOOTER */
  .lp-footer { padding: 60px 40px; border-top: 1px solid var(--line); background: var(--bg-0); color: var(--ink-2); font-size: 13px; }
  .lp-foot-wrap { max-width: 1180px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 20px; flex-wrap: wrap; }
  .lp-foot-links { display: flex; gap: 24px; }
  .lp-foot-links a:hover { color: var(--ink-0); }

  /* Pin positions */
  .lp-pin-1 { left: 38%; top: 32%; }
  .lp-pin-2 { left: 68%; top: 48%; }
  .lp-pin-3 { left: 25%; top: 65%; }
  .lp-pin-4 { left: 78%; top: 78%; }
  .lp-pin-5 { left: 48%; top: 82%; }

  /* Legend dot colors */
  .lp-sw-low { background: #5bb8ff; }
  .lp-sw-mid { background: #c779ff; }
  .lp-sw-high { background: #ff7a4d; }

  /* Logo image fill */
  .lp-brand-logo { width: 100%; height: 100%; object-fit: cover; display: block; }

  @media (max-width: 880px) {
    .lp-grid-3 { grid-template-columns: 1fr; }
    .lp-map-wrap { grid-template-columns: 1fr; gap: 40px; }
    .lp-nav { padding: 16px 20px; }
    .lp-features, .lp-map-section { padding-left: 20px; padding-right: 20px; }
  }
`

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

    const k = 1
    const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t

    function onScroll() {
      if (!hero || !photo || !copy || !glowA || !glowB || !glowC || !scrollHint) return
      const heroRect = hero.getBoundingClientRect()
      const scrolled = -heroRect.top
      const heroHeight = hero.offsetHeight - window.innerHeight
      const t = clamp(scrolled / heroHeight, 0, 1)

      if (window.scrollY > 30) nav?.classList.add('lp-scrolled')
      else nav?.classList.remove('lp-scrolled')

      const ps = lerp(1.35, 1.0, t)
      const py = -t * 80 * k
      photo.style.transform = `translate3d(0, ${py}px, 0) scale(${ps})`
      photo.style.opacity = String(lerp(1, 0.35, t))
      photo.style.filter = `brightness(${lerp(1.0, 0.55, t)})`
      copy.style.transform = `translate3d(0, ${-t * 100 * k}px, 0) scale(${lerp(1, 0.92, t)})`
      copy.style.opacity = String(lerp(1, 0, clamp(t * 1.5, 0, 1)))
      glowA.style.transform = `translate3d(${-t * 60 * k}px, ${-t * 40 * k}px, 0)`
      glowB.style.transform = `translate3d(${t * 80 * k}px, ${t * 60 * k}px, 0)`
      glowC.style.transform = `translate(-50%,-50%) translate3d(0, ${-t * 120 * k}px, 0) scale(${1 + t * 0.3 * k})`
      scrollHint.style.opacity = String(lerp(1, 0, clamp(t * 4, 0, 1)))
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
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <nav ref={navRef} className="lp-nav">
        <Link className="lp-brand" href="/">
          <span className="lp-brand-mark">
            <Image src="/logo.jpeg" alt="Ozio" width={34} height={34} className="lp-brand-logo" />
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
              <button type="button" className="lp-btn" disabled>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                  <path d="M17.5 12.5c0-2.4 2-3.6 2.1-3.6-1.1-1.6-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9s-2-.9-3.2-.8c-1.7 0-3.2 1-4 2.5-1.7 3-.4 7.4 1.2 9.8.8 1.2 1.8 2.5 3 2.4s1.7-.8 3.1-.8 1.9.8 3.2.8 2.2-1.2 3-2.4c1-1.4 1.4-2.7 1.4-2.8s-2.6-1-2.6-4.1zM15 4.6c.7-.8 1.1-1.9 1-3-1 0-2.1.7-2.8 1.5-.6.7-1.1 1.8-1 2.9 1.1.1 2.2-.5 2.8-1.4z" />
                </svg>
                App Store <span className="lp-soft">Próximamente</span>
              </button>
              <button type="button" className="lp-btn" disabled>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M4 3 L18 12 L4 21 Z" fill="white" />
                </svg>
                Google Play <span className="lp-soft">Próximamente</span>
              </button>
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
