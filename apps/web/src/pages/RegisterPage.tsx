import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '@/lib/api'

const FEATURES = [
  { icon: '⚡', label: 'Real-time sync',       desc: 'See edits as they happen' },
  { icon: '🔒', label: 'Role-based access',    desc: 'Editor or Viewer per snippet' },
  { icon: '🏷️', label: 'Tags & folders',       desc: 'Organise your library' },
  { icon: '🎨', label: 'Monaco editor',        desc: 'VS Code engine in browser' },
]

export function RegisterPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [done, setDone]         = useState(false)
  const nav = useNavigate()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (password.length < 8)  { setError('Password must be at least 8 characters'); return }
    setError('')
    setLoading(true)
    try {
      await api.auth.register(email, password)
      setDone(true)
      setTimeout(() => nav('/login'), 2000)
    } catch {
      setError('Registration failed — this email may already be in use')
    } finally {
      setLoading(false)
    }
  }

  const strength = password.length === 0 ? 0
    : password.length < 8  ? 1
    : password.length < 12 ? 2
    : 3

  const strengthLabel = ['', 'Weak', 'Good', 'Strong']
  const strengthColor = ['', '#ff6b6b', '#ffca3a', '#4fffb0']

  return (
    <div className="min-h-screen bg-bg flex overflow-hidden relative">

      {/* Background grid */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(77,201,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(77,201,255,0.025) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />

      {/* Glow orbs */}
      <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(77,201,255,0.05) 0%, transparent 70%)' }} />
      <div className="absolute bottom-[-150px] left-[20%] w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(79,255,176,0.04) 0%, transparent 70%)' }} />

      {/* ── Form panel (left) ── */}
      <div className="flex flex-col items-center justify-center w-full lg:w-[460px] lg:min-w-[460px] px-8 py-12 relative">

        <div className="w-full max-w-[360px]">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-10 animate-fade-in">
            <div className="w-8 h-8 bg-accent rounded-lg grid place-items-center">
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                <path d="M2 4l5 3-5 3V4z" fill="#000"/>
                <rect x="9" y="6" width="5" height="1.4" rx=".7" fill="#000"/>
                <rect x="9" y="9" width="3" height="1.4" rx=".7" fill="#000"/>
              </svg>
            </div>
            <span className="font-extrabold text-base tracking-tight">
              Dev<span className="text-accent">Sync</span>
            </span>
          </div>

          {done ? (
            <div className="animate-scale-in text-center py-8">
              <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/30 grid place-items-center text-3xl mx-auto mb-5">
                ✓
              </div>
              <h2 className="text-xl font-extrabold text-accent tracking-tight mb-2">
                Account created!
              </h2>
              <p className="text-muted font-mono text-xs">
                Redirecting to sign in…
              </p>
            </div>
          ) : (
            <>
              <div className="mb-8 animate-fade-up">
                <h1 className="text-2xl font-extrabold tracking-tight leading-tight">
                  Create your account
                </h1>
                <p className="text-muted font-mono text-xs mt-1.5">
                  Free forever. No credit card required.
                </p>
              </div>

              <form onSubmit={submit} className="flex flex-col gap-4 animate-fade-up">
                {error && (
                  <div className="bg-accent3/10 border border-accent3/30 rounded-lg px-4 py-3 flex items-center gap-2.5 animate-scale-in">
                    <span className="text-accent3 text-sm">⚠</span>
                    <p className="text-accent3 text-xs font-mono">{error}</p>
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[10px] text-muted uppercase tracking-widest">
                    Email
                  </label>
                  <input
                    className="input-base"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[10px] text-muted uppercase tracking-widest">
                    Password
                  </label>
                  <input
                    className="input-base"
                    type="password"
                    placeholder="Min 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                  {/* Strength meter */}
                  {password.length > 0 && (
                    <div className="flex items-center gap-2 mt-1 animate-fade-in">
                      <div className="flex gap-1 flex-1">
                        {[1, 2, 3].map((n) => (
                          <div
                            key={n}
                            className="h-[3px] flex-1 rounded-full transition-all duration-300"
                            style={{
                              background: n <= strength
                                ? strengthColor[strength]
                                : '#1f2330',
                            }}
                          />
                        ))}
                      </div>
                      <span
                        className="font-mono text-[9px] transition-colors"
                        style={{ color: strengthColor[strength] }}
                      >
                        {strengthLabel[strength]}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[10px] text-muted uppercase tracking-widest">
                    Confirm Password
                  </label>
                  <input
                    className="input-base"
                    type="password"
                    placeholder="Repeat password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    autoComplete="new-password"
                    style={{
                      borderColor: confirm && confirm !== password
                        ? 'rgba(255,107,107,0.5)'
                        : confirm && confirm === password
                          ? 'rgba(79,255,176,0.4)'
                          : '',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-accent w-full py-3 mt-1 text-sm disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full"
                        style={{ animation: 'spin 0.7s linear infinite' }} />
                      Creating account…
                    </>
                  ) : 'Create Account →'}
                </button>
              </form>

              <p className="text-center font-mono text-[11px] text-muted mt-6 animate-fade-up">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-accent hover:text-white transition-colors underline underline-offset-2"
                >
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>

      {/* ── Features panel (right) ── */}
      <div className="hidden lg:flex flex-1 flex-col justify-center px-16 py-12 relative">
        <div className="max-w-sm animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <p className="font-mono text-[10px] text-accent uppercase tracking-[0.2em] mb-5">
            What you get
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight leading-snug mb-10">
            Everything your team<br/>
            needs to move fast.
          </h2>

          <div className="flex flex-col gap-5 stagger">
            {FEATURES.map((f) => (
              <div
                key={f.label}
                className="animate-slide-right flex items-start gap-4 group"
              >
                <div className="w-10 h-10 rounded-xl bg-card border border-border grid place-items-center text-xl flex-shrink-0 group-hover:border-accent/40 transition-colors">
                  {f.icon}
                </div>
                <div className="pt-1">
                  <p className="font-bold text-sm text-white">{f.label}</p>
                  <p className="font-mono text-xs text-muted mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Social proof */}
          <div className="mt-12 pt-8 border-t border-border">
            <div className="flex -space-x-2 mb-3">
              {['#4fffb0','#4dc9ff','#a78bfa','#ffca3a','#ff6b6b'].map((c, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border-2 border-bg grid place-items-center text-[10px] font-black text-black"
                  style={{ background: c }}
                >
                  {['JD','AX','MK','SR','LT'][i]}
                </div>
              ))}
            </div>
            <p className="font-mono text-xs text-muted">
              Joined by <span className="text-white">1,200+</span> developers
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
