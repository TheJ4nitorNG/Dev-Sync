import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'

const CODE_PREVIEW = `// useSocketSync.ts
export function useSocketSync(
  snippetId: string
) {
  const [peers, setPeers] =
    useState<Peer[]>([])

  useEffect(() => {
    const socket = io({ auth })
    socket.on('peers:update',
      setPeers)
    return () =>
      socket.disconnect()
  }, [snippetId])
}`

export function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const setAuth = useAuthStore((s) => s.setAuth)
  const nav = useNavigate()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.auth.login(email, password)
      setAuth(res.data.token, res.data.userId, res.data.email)
      nav('/')
    } catch {
      setError('Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex overflow-hidden relative">

      {/* ── Background grid lines ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(79,255,176,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(79,255,176,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />

      {/* ── Glow orbs ── */}
      <div className="absolute top-[-180px] left-[-180px] w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(79,255,176,0.06) 0%, transparent 70%)' }} />
      <div className="absolute bottom-[-120px] right-[30%] w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(77,201,255,0.05) 0%, transparent 70%)' }} />

      {/* ── Left panel — code preview ── */}
      <div className="hidden lg:flex flex-col flex-1 relative px-16 py-12 justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3 animate-fade-in">
          <div className="w-8 h-8 bg-accent rounded-lg grid place-items-center flex-shrink-0">
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

        {/* Fake editor window */}
        <div className="animate-fade-up" style={{ animationDelay: '0.15s' }}>
          <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-2xl shadow-black/50 max-w-lg">
            {/* Window chrome */}
            <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-accent3/70" />
                <div className="w-3 h-3 rounded-full bg-accent4/70" />
                <div className="w-3 h-3 rounded-full bg-accent/70" />
              </div>
              <span className="font-mono text-[11px] text-muted flex-1 text-center">
                useSocketSync.ts
              </span>
              <div className="flex items-center gap-1.5">
                <span className="live-dot" />
                <span className="font-mono text-[9px] text-accent">2 editing</span>
              </div>
            </div>
            {/* Code */}
            <div className="p-5 font-mono text-[12px] leading-[1.8]">
              {CODE_PREVIEW.split('\n').map((line, i) => (
                <div key={i} className="flex gap-4">
                  <span className="text-dim select-none w-4 text-right flex-shrink-0 text-[10px]">
                    {i + 1}
                  </span>
                  <span
                    className="text-[#7c8db0]"
                    style={{ animationDelay: `${0.3 + i * 0.04}s` }}
                    dangerouslySetInnerHTML={{
                      __html: line
                        .replace(/\b(export|function|const|useEffect|return|useState)\b/g,
                          '<span style="color:#c792ea">$1</span>')
                        .replace(/\b(string|Peer|boolean)\b/g,
                          '<span style="color:#ffcb6b">$1</span>')
                        .replace(/'[^']*'/g,
                          (m) => `<span style="color:#c3e88d">${m}</span>`)
                        .replace(/\/\/.*/g,
                          (m) => `<span style="color:#3d4f6a;font-style:italic">${m}</span>`)
                        || '&nbsp;',
                    }}
                  />
                </div>
              ))}
              {/* Blinking cursor on last line */}
              <div className="flex gap-4 mt-0.5">
                <span className="text-dim select-none w-4 text-right flex-shrink-0 text-[10px]">
                  {CODE_PREVIEW.split('\n').length + 1}
                </span>
                <span
                  className="inline-block w-[2px] h-[14px] bg-accent cursor-blink"
                  style={{ marginTop: '3px' }}
                />
              </div>
            </div>
            {/* Peer cursors status bar */}
            <div className="border-t border-border px-4 py-2 flex items-center gap-4 bg-card/50">
              {[
                { name: 'JD', color: '#4fffb0', line: 'Ln 14, Col 24' },
                { name: 'AX', color: '#a78bfa', line: 'Ln 9, Col 11'  },
              ].map((p) => (
                <span key={p.name} className="flex items-center gap-1.5 font-mono text-[9px]">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
                  <span style={{ color: p.color }}>{p.name}</span>
                  <span className="text-dim">{p.line}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Tagline */}
          <div className="mt-10 max-w-sm">
            <p className="text-2xl font-extrabold tracking-tight leading-snug text-white">
              The collaborative code<br/>
              <span className="text-accent">snippet manager</span><br/>
              built for real teams.
            </p>
            <p className="mt-3 text-sm text-muted font-mono leading-relaxed">
              Save, tag, and live-edit snippets with your team.<br/>
              Real-time sync. Zero friction.
            </p>
          </div>
        </div>

        <p className="font-mono text-[10px] text-dim animate-fade-in" style={{ animationDelay: '0.5s' }}>
          © 2025 DevSync
        </p>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex flex-col items-center justify-center w-full lg:w-[420px] lg:min-w-[420px] px-8 py-12 relative">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2.5 mb-10 animate-fade-in">
          <div className="w-8 h-8 bg-accent rounded-lg grid place-items-center">
            <span className="text-black text-[10px] font-black">DS</span>
          </div>
          <span className="font-extrabold text-base tracking-tight">
            Dev<span className="text-accent">Sync</span>
          </span>
        </div>

        <div className="w-full max-w-[340px] stagger">
          <div className="animate-fade-up mb-8">
            <h1 className="text-2xl font-extrabold tracking-tight leading-tight">
              Welcome back
            </h1>
            <p className="text-muted font-mono text-xs mt-1.5">
              Sign in to your workspace
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
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-accent w-full py-3 mt-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full"
                    style={{ animation: 'spin 0.7s linear infinite' }} />
                  Signing in…
                </>
              ) : 'Sign In →'}
            </button>
          </form>

          <p className="text-center font-mono text-[11px] text-muted mt-6 animate-fade-up">
            No account?{' '}
            <Link
              to="/register"
              className="text-accent hover:text-white transition-colors underline underline-offset-2"
            >
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
