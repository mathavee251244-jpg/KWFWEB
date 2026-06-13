import { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, LogIn, ShieldCheck, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const BG_VIDEO =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260503_101827_abebfeec-f243-466b-b494-7f6814c0fbbf.mp4';

// ── Letter-by-letter animated word ───────────────────────────────────────────
function AnimWord({
  word, baseDelay, style,
}: {
  word: string;
  baseDelay: number;
  style?: React.CSSProperties;
}) {
  return (
    <div className="flex" style={{ gap: '0.02em', ...style }}>
      {word.split('').map((ch, i) => (
        <span
          key={i}
          style={{
            display: 'inline-block',
            animation: `letter-rise 0.75s cubic-bezier(0.16,1,0.3,1) both`,
            animationDelay: `${baseDelay + i * 0.055}s`,
            willChange: 'transform, opacity, filter',
          }}
        >
          {ch === ' ' ? ' ' : ch}
        </span>
      ))}
    </div>
  );
}

// ── Splash phase ──────────────────────────────────────────────────────────────
function SplashView({ onEnter }: { onEnter: () => void }) {
  const [hinted, setHinted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setHinted(true), 1800);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer select-none"
      onClick={onEnter}
    >
      {/* Main brand text */}
      <div className="flex flex-col items-center gap-0">
        <AnimWord
          word="BANGKOK"
          baseDelay={0.1}
          style={{
            fontSize: 'clamp(52px, 11vw, 148px)',
            fontWeight: 100,
            letterSpacing: '0.18em',
            color: 'rgba(255,255,255,0.88)',
            textShadow: '0 4px 40px rgba(0,0,0,0.5)',
            lineHeight: 1,
          }}
        />
        <AnimWord
          word="SEAFOOD"
          baseDelay={0.5}
          style={{
            fontSize: 'clamp(52px, 11vw, 148px)',
            fontWeight: 100,
            letterSpacing: '0.18em',
            color: 'rgba(255,255,255,0.88)',
            textShadow: '0 4px 40px rgba(0,0,0,0.5)',
            lineHeight: 1,
          }}
        />
      </div>

      {/* Divider line */}
      <div
        style={{
          width: 'clamp(120px, 22vw, 300px)',
          height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.40), transparent)',
          marginTop: 'clamp(16px, 3vw, 28px)',
          transformOrigin: 'center',
          animation: 'splash-line-in 0.6s 1.4s cubic-bezier(0.16,1,0.3,1) both',
        }}
      />

      {/* Sub label */}
      <p
        style={{
          marginTop: 'clamp(10px, 2vw, 18px)',
          fontSize: 'clamp(9px, 1.1vw, 13px)',
          color: 'rgba(255,255,255,0.42)',
          animation: 'splash-sub-in 0.7s 1.5s cubic-bezier(0.16,1,0.3,1) both',
          opacity: 0,
        }}
      >
        CO., LTD. &nbsp;·&nbsp; IT HELPDESK PORTAL
      </p>

      {/* Click hint */}
      <p
        style={{
          position: 'absolute',
          bottom: 'clamp(28px, 5vh, 52px)',
          fontSize: 'clamp(9px, 1vw, 11px)',
          letterSpacing: '0.3em',
          color: 'rgba(255,255,255,0.38)',
          textTransform: 'uppercase',
          opacity: hinted ? 1 : 0,
          transition: 'opacity 0.8s ease',
          animation: hinted ? 'tap-hint 2.2s ease-in-out infinite' : 'none',
        }}
      >
        Click Anywhere to Enter
      </p>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function LoginScreen() {
  const { login } = useApp();
  const [phase, setPhase] = useState<'splash' | 'exiting' | 'login'>('login');
  const [userId, setUserId] = useState('');
  const [pwd, setPwd]       = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [err, setErr]       = useState('');
  const [loading, setLoading] = useState(false);
  const [flash, setFlash]   = useState(false);
  const userIdRef = useRef<HTMLInputElement>(null);

  const handleEnter = () => {
    if (phase !== 'splash') return;
    setFlash(true);
    setPhase('exiting');
    setTimeout(() => {
      setFlash(false);
      setPhase('login');
      setTimeout(() => userIdRef.current?.focus(), 50);
    }, 520);
  };

  const handleLogin = async () => {
    if (!userId.trim() || !pwd) return;
    setLoading(true);
    setErr('');
    try {
      await login(userId.trim(), pwd);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'เข้าสู่ระบบไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  // Keyboard shortcut on splash
  useEffect(() => {
    if (phase !== 'splash') return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') handleEnter();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase]);

  return (
    <div className="w-screen h-screen overflow-hidden relative flex flex-col items-center justify-center">

      {/* Video background */}
      <video
        autoPlay muted loop playsInline
        className="absolute inset-0 w-full h-full object-cover"
        src={BG_VIDEO}
      />

      {/* Vignette overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to top, rgba(0,0,0,0.52) 0%, rgba(0,0,0,0.18) 50%, rgba(0,0,0,0.04) 100%)',
        }}
      />

      {/* Flash overlay on transition */}
      <div
        className="absolute inset-0 pointer-events-none z-50"
        style={{
          background: 'rgba(255,255,255,0.55)',
          opacity: flash ? 1 : 0,
          transition: flash ? 'opacity 0.12s ease' : 'opacity 0.4s ease',
        }}
      />

      {/* ── SPLASH ── */}
      {phase !== 'login' && (
        <div
          className="absolute inset-0 z-10"
          style={{
            transform: phase === 'exiting' ? 'scale(1.07)' : 'scale(1)',
            opacity:   phase === 'exiting' ? 0 : 1,
            transition: 'transform 0.5s cubic-bezier(0.4,0,1,1), opacity 0.45s ease',
          }}
        >
          <SplashView onEnter={handleEnter} />
        </div>
      )}

      {/* ── LOGIN ── */}
      {phase === 'login' && (
        <>
          {/* Brand header */}
          <div className="relative login-brand-in text-center select-none mb-6 sm:mb-8 px-4 z-10">
            <p
              className="text-[10px] sm:text-[11px] tracking-[0.28em] uppercase mb-2"
              style={{ color: 'rgba(255,255,255,0.50)' }}
            >
              Bangkok Seafood Co., Ltd.
            </p>
            <h1
              className="text-[26px] sm:text-[32px] font-light tracking-[0.12em]"
              style={{ color: 'rgba(255,255,255,0.90)', textShadow: '0 2px 16px rgba(0,0,0,0.35)' }}
            >
              IT Helpdesk
            </h1>
            <div
              className="mt-3 h-px w-10 mx-auto rounded-full"
              style={{ background: 'rgba(255,255,255,0.30)' }}
            />
          </div>

          {/* Login card */}
          <div
            className="relative login-slide-up w-full max-w-[420px] mx-4 z-10"
            style={{
              background: 'rgba(255,255,255,0.11)',
              backdropFilter: 'blur(26px) saturate(1.35)',
              WebkitBackdropFilter: 'blur(26px) saturate(1.35)',
              border: '1px solid rgba(255,255,255,0.22)',
              borderRadius: '20px',
              boxShadow: '0 8px 40px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.20)',
            }}
          >
            {/* Icon + subtitle */}
            <div className="flex flex-col items-center pt-7 pb-4 px-8">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
                style={{
                  background: 'rgba(255,255,255,0.14)',
                  border: '1px solid rgba(255,255,255,0.28)',
                }}
              >
                <ShieldCheck size={28} style={{ color: 'rgba(255,255,255,0.85)' }} />
              </div>
              <p style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.72)', letterSpacing: '0.04em' }}>
                เข้าสู่ระบบ
              </p>
            </div>

            <div className="mx-8 h-px" style={{ background: 'rgba(255,255,255,0.12)' }} />

            {/* Form */}
            <div className="px-6 sm:px-8 py-5 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.50)', textTransform: 'uppercase', letterSpacing: '0.10em' }}>
                  Username / ID
                </label>
                <input
                  ref={userIdRef}
                  className="login-input"
                  placeholder="เช่น admin, fern, hr01"
                  value={userId}
                  onChange={e => { setUserId(e.target.value); setErr(''); }}
                  onKeyDown={e => e.key === 'Enter' && document.getElementById('login-pwd')?.focus()}
                  autoComplete="username"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.50)', textTransform: 'uppercase', letterSpacing: '0.10em' }}>
                  รหัสผ่าน
                </label>
                <div className="relative">
                  <input
                    id="login-pwd"
                    type={showPwd ? 'text' : 'password'}
                    className="login-input pr-11"
                    placeholder="••••••••"
                    value={pwd}
                    onChange={e => { setPwd(e.target.value); setErr(''); }}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    autoComplete="current-password"
                  />
                  <button
                    tabIndex={-1}
                    onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: 'rgba(255,255,255,0.40)' }}
                  >
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {err && (
                <div
                  className="flex items-center gap-2 rounded-xl px-3 py-2.5 -mt-1"
                  style={{ fontSize: '12px', color: '#f87171', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}
                >
                  <AlertCircle size={13} className="shrink-0" />
                  {err}
                </div>
              )}

              <button
                onClick={handleLogin}
                disabled={!userId.trim() || !pwd || loading}
                className="login-btn mt-1"
              >
                {loading
                  ? <span className="animate-pulse">กำลังเข้าสู่ระบบ...</span>
                  : <><LogIn size={16} /> เข้าสู่ระบบ</>
                }
              </button>
            </div>

            <div className="px-8 pb-6 text-center">
              <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.28)' }}>
                รหัสผ่านเริ่มต้น:{' '}
                <span style={{ color: 'rgba(255,255,255,0.48)', fontFamily: 'monospace' }}>Com@1234</span>
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
