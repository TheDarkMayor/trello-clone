import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const DEMO = { email: 'admin@taskflow.com', password: 'admin123' };

/* ── Kanban icon (animated columns) ── */
function KanbanIcon() {
  return (
    <svg className="kanban-icon" viewBox="0 0 40 40" width="40" height="40" fill="none">
      <rect x="3" y="8" width="9" height="24" rx="2.5" fill="rgba(255,255,255,0.9)" />
      <rect x="15.5" y="8" width="9" height="17" rx="2.5" fill="rgba(255,255,255,0.65)" />
      <rect x="28" y="8" width="9" height="20" rx="2.5" fill="rgba(255,255,255,0.45)" />
    </svg>
  );
}

/* ── Floating label input ── */
function FloatInput({ label, type = 'text', value, onChange, error, icon }) {
  const [focused, setFocused] = useState(false);
  const filled = value.length > 0;
  return (
    <div className={`fl-wrap ${focused ? 'focused' : ''} ${filled ? 'filled' : ''} ${error ? 'has-error' : ''}`}>
      <span className="fl-icon">{icon}</span>
      <input
        type={type}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoComplete="off"
      />
      <label className="fl-label">{label}</label>
      {error && <span className="fl-error">{error}</span>}
    </div>
  );
}

/* ── Sparkle dots ── */
const SPARKLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: 2 + Math.random() * 3,
  delay: Math.random() * 4,
  dur: 2 + Math.random() * 3,
}));

/* ── Floating UI mock cards ── */
const MOCK_CARDS = [
  { icon: '✅', text: 'Design review done', sub: 'Moved to · Done', color: '#22c55e', delay: '0s', x: '6%', y: '20%' },
  { icon: '🗂️', text: 'Sprint Board', sub: '3 lists · 12 cards active', color: '#818cf8', delay: '0.6s', x: '4%', y: '50%' },
  { icon: '🚀', text: 'Launch checklist', sub: 'In Progress · 6 of 9 done', color: '#38bdf8', delay: '1.2s', x: '8%', y: '76%' },
  { icon: '🏷️', text: 'Bug triage', sub: 'High priority · 2 cards', color: '#f472b6', delay: '1.8s', x: '60%', y: '6%' },
];

export default function Login() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [sliding, setSliding] = useState(false);
  const [slideDir, setSlideDir] = useState('up');
  const [darkMode, setDarkMode] = useState(false);
  const [cardTilt, setCardTilt] = useState({ x: 0, y: 0 });
  const cardRef = useRef(null);
  const pageRef = useRef(null);
  const navigate = useNavigate();

  // Override body background for this page
  useEffect(() => {
    const prev = document.body.style.background;
    document.body.style.background = 'linear-gradient(135deg, #0f0c29 0%, #1a1040 40%, #0d1b3e 100%)';
    return () => { document.body.style.background = prev; };
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  /* Mouse parallax */
  const handleMouseMove = useCallback((e) => {
    const { innerWidth: W, innerHeight: H } = window;
    const nx = (e.clientX / W - 0.5) * 2;
    const ny = (e.clientY / H - 0.5) * 2;
    // Move blobs slightly
    document.querySelectorAll('.blob').forEach((b, i) => {
      const factor = (i + 1) * 8;
      b.style.transform = `translate(${nx * factor}px, ${ny * factor}px)`;
    });
    // Card tilt
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const cx = (e.clientX - rect.left) / rect.width - 0.5;
      const cy = (e.clientY - rect.top) / rect.height - 0.5;
      setCardTilt({ x: cy * 8, y: cx * -8 });
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setCardTilt({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  const switchMode = (m) => {
    setSlideDir(m === 'signup' ? 'up' : 'down');
    setSliding(true);
    setTimeout(() => { setMode(m); setErrors({}); setSliding(false); }, 320);
  };

  const validate = () => {
    const e = {};
    if (mode === 'signup' && !form.name.trim()) e.name = 'Name is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Valid email required';
    if (!form.password) e.password = 'Password is required';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    navigate('/');
  };

  const useDemo = () => {
    setForm(f => ({ ...f, email: DEMO.email, password: DEMO.password }));
    setTimeout(() => navigate('/'), 400);
  };

  return (
    <div className={`lp-root ${darkMode ? 'dark' : ''}`} ref={pageRef}>

      {/* ── Animated blob background ── */}
      <div className="blob-stage" aria-hidden="true">
        <svg className="blob blob-1" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <path d="M44.7,-62.3C56.8,-53.2,63.5,-37.6,68.1,-21.4C72.7,-5.2,75.2,11.6,70.1,25.8C65,40,52.3,51.5,38.3,59.3C24.3,67.1,9,71.2,-6.2,70.2C-21.4,69.2,-36.5,63.1,-48.3,53.1C-60.1,43.1,-68.6,29.2,-71.2,13.9C-73.8,-1.4,-70.5,-18.1,-62.3,-31.5C-54.1,-44.9,-41,-55,-27.3,-63.2C-13.6,-71.4,0.7,-77.7,14.8,-75.6C28.9,-73.5,32.6,-71.4,44.7,-62.3Z" />
        </svg>
        <svg className="blob blob-2" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <path d="M39.5,-51.2C50.3,-42.8,57.5,-29.5,62.1,-14.5C66.7,0.5,68.7,17.2,63.2,31.1C57.7,45,44.7,56.1,30.1,62.5C15.5,68.9,-0.7,70.6,-16.2,66.8C-31.7,63,-46.5,53.7,-56.4,40.5C-66.3,27.3,-71.3,10.2,-69.8,-6.3C-68.3,-22.8,-60.3,-38.7,-48.4,-47.2C-36.5,-55.7,-20.7,-56.8,-4.5,-51.7C11.7,-46.6,28.7,-59.6,39.5,-51.2Z" />
        </svg>
        <svg className="blob blob-3" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <path d="M47.7,-58.2C60.5,-48.3,68.5,-32.5,71.8,-15.5C75.1,1.5,73.7,19.7,65.5,34.1C57.3,48.5,42.3,59.1,26.3,65.3C10.3,71.5,-6.7,73.3,-22.1,68.5C-37.5,63.7,-51.3,52.3,-60.3,37.8C-69.3,23.3,-73.5,5.7,-70.7,-10.5C-67.9,-26.7,-58.1,-41.5,-45.3,-51.5C-32.5,-61.5,-16.7,-66.7,0.3,-67C17.3,-67.3,34.9,-68.1,47.7,-58.2Z" />
        </svg>
        <svg className="blob blob-4" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <path d="M36.4,-48.3C46.3,-39.1,52.8,-26.3,57.5,-11.8C62.2,2.7,65.1,18.9,60.1,32.3C55.1,45.7,42.2,56.3,27.8,62.5C13.4,68.7,-2.5,70.5,-17.3,66.3C-32.1,62.1,-45.8,51.9,-55.3,38.5C-64.8,25.1,-70.1,8.5,-68.5,-7.3C-66.9,-23.1,-58.4,-38.1,-46.5,-47.3C-34.6,-56.5,-19.3,-59.9,-3.5,-55.9C12.3,-51.9,26.5,-57.5,36.4,-48.3Z" />
        </svg>
        <svg className="blob blob-5" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <path d="M42.1,-55.3C53.4,-46.2,60.3,-31.5,64.8,-15.5C69.3,0.5,71.4,17.8,65.5,31.8C59.6,45.8,45.7,56.5,30.5,63.1C15.3,69.7,-1.2,72.2,-17.1,68.5C-33,64.8,-48.3,54.9,-58.3,41.1C-68.3,27.3,-73,9.6,-70.8,-7.1C-68.6,-23.8,-59.5,-39.5,-47.1,-48.7C-34.7,-57.9,-19,-60.6,-2.5,-57.7C14,-54.8,30.8,-64.4,42.1,-55.3Z" />
        </svg>
      </div>

      {/* ── Sparkle dots ── */}
      <div className="sparkle-layer" aria-hidden="true">
        {SPARKLES.map(sp => (
          <span key={sp.id} className="sparkle" style={{
            left: `${sp.x}%`, top: `${sp.y}%`,
            width: sp.size, height: sp.size,
            animationDelay: `${sp.delay}s`,
            animationDuration: `${sp.dur}s`,
          }} />
        ))}
      </div>

      {/* ── Left content area ── */}
      <div className="lp-left">
        <div className="lp-brand">
          <KanbanIcon />
          <span className="lp-brand-name">TaskFlow</span>
          <button className="dark-toggle" onClick={() => setDarkMode(d => !d)} title="Toggle dark mode">
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>

        <div className="lp-headline">
          <h1>
            Boards, lists,<br />
            <span className="grad-text">cards. Ship faster.</span>
          </h1>
          <p>Drag, drop, and organize your team's work<br />with a Kanban board built for speed.</p>
        </div>

        {/* Floating mock UI cards */}
        <div className="mock-cards-stage">
          {MOCK_CARDS.map((c, i) => (
            <div key={i} className="mock-card" style={{
              '--delay': c.delay,
              '--x': c.x,
              '--y': c.y,
            }}>
              <span className="mc-icon" style={{ background: c.color + '22', color: c.color }}>{c.icon}</span>
              <div className="mc-text">
                <div className="mc-title">{c.text}</div>
                <div className="mc-sub">{c.sub}</div>
              </div>
              <span className="mc-dot" style={{ background: c.color }} />
            </div>
          ))}
        </div>
      </div>

      {/* ── Auth card ── */}
      <div className="lp-right">
        <div
          ref={cardRef}
          className={`glass-card ${sliding ? `slide-${slideDir}` : 'slide-in'}`}
          style={{ transform: `perspective(900px) rotateX(${cardTilt.x}deg) rotateY(${cardTilt.y}deg)` }}
          onMouseLeave={handleMouseLeave}
        >
          {/* Card glow */}
          <div className="card-glow" aria-hidden="true" />

          <div className="gc-header">
            <div className="gc-mode-pills">
              <button className={mode === 'login' ? 'pill active' : 'pill'} onClick={() => mode !== 'login' && switchMode('login')}>Sign in</button>
              <button className={mode === 'signup' ? 'pill active' : 'pill'} onClick={() => mode !== 'signup' && switchMode('signup')}>Sign up</button>
            </div>
          </div>

          <h2 className="gc-title">
            {mode === 'login' ? 'Welcome back 👋' : 'Create your board ✨'}
          </h2>
          <p className="gc-sub">
            {mode === 'login'
              ? 'Sign in to your workspace and pick up right where you left off.'
              : 'Set up your account and start building Kanban boards in seconds.'}
          </p>

          {/* Demo card */}
          {mode === 'login' && (
            <div className="demo-card">
              <div className="demo-card-left">
                <span className="demo-badge">DEMO</span>
                <div className="demo-info">
                  <span>{DEMO.email}</span>
                  <span className="demo-pw">{DEMO.password}</span>
                </div>
              </div>
              <button className="demo-access-btn" onClick={useDemo}>
                <span>Try the Board</span>
                <span className="btn-arrow">→</span>
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="gc-form">
            {mode === 'signup' && (
              <FloatInput
                label="Full name"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                error={errors.name}
                icon="👤"
              />
            )}
            <FloatInput
              label="Email address"
              type="email"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              error={errors.email}
              icon="✉️"
            />
            <FloatInput
              label="Password"
              type="password"
              value={form.password}
              onChange={e => set('password', e.target.value)}
              error={errors.password}
              icon="🔒"
            />

            <button type="submit" className="grad-btn">
              <span>{mode === 'login' ? 'Go to My Boards' : 'Start Building'}</span>
              <span className="btn-shine" />
            </button>
          </form>

          <p className="gc-footer">
            {mode === 'login' ? (
              <>New to TaskFlow?{' '}
                <button className="link-btn" onClick={() => switchMode('signup')}>Create a free account →</button>
              </>
            ) : (
              <>Already have a workspace?{' '}
                <button className="link-btn" onClick={() => switchMode('login')}>Sign in →</button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
