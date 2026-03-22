import { useState } from 'react'
import type { Collaborator } from '@dev-sync/types'
import { api } from '@/lib/api'

interface CollaboratorPanelProps {
  snippetId: string
  collaborators: Collaborator[]
  onClose: () => void
}

export function CollaboratorPanel({ snippetId, collaborators, onClose }: CollaboratorPanelProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'Editor' | 'Viewer'>('Viewer')
  const [status, setStatus] = useState<{ msg: string; ok: boolean } | null>(null)
  const [loading, setLoading] = useState(false)

  const invite = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setStatus(null)
    try {
      await api.snippets.invite(snippetId, email, role)
      setStatus({ msg: `${email} invited as ${role}`, ok: true })
      setEmail('')
    } catch {
      setStatus({ msg: 'User not found or already a collaborator', ok: false })
    } finally {
      setLoading(false)
    }
  }

  return (
    <aside className="w-72 bg-surface border-l border-border flex flex-col flex-shrink-0">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <h2 className="font-extrabold text-xs tracking-tight">Collaborators</h2>
        <button onClick={onClose} className="text-muted hover:text-white text-lg leading-none transition-colors">×</button>
      </div>

      {/* Existing collaborators */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
        {collaborators.length === 0 ? (
          <p className="text-muted text-xs font-mono">No collaborators yet.</p>
        ) : (
          collaborators.map((c) => (
            <div key={c.userId} className="flex items-center gap-3 py-2 border-b border-border">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple to-accent2 grid place-items-center text-[9px] font-black text-white flex-shrink-0">
                {c.user.email.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate">{c.user.email}</p>
                <p className="text-[9px] font-mono text-muted">{c.role}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Invite form */}
      <form onSubmit={invite} className="px-4 py-4 border-t border-border flex flex-col gap-3">
        <p className="text-[10px] font-mono text-muted uppercase tracking-widest">Invite by email</p>
        {status && (
          <p className={`text-[10px] font-mono ${status.ok ? 'text-accent' : 'text-accent3'}`}>
            {status.msg}
          </p>
        )}
        <input
          type="email"
          placeholder="user@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="bg-card border border-border rounded-lg px-3 py-2 text-xs font-mono outline-none focus:border-accent transition-colors"
        />
        <div className="flex gap-2">
          {(['Viewer', 'Editor'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`flex-1 text-[10px] font-bold py-1.5 rounded-lg border transition-colors ${
                role === r
                  ? 'bg-accent/10 text-accent border-accent/30'
                  : 'bg-card text-muted border-border hover:text-white'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-accent text-black text-xs font-bold py-2 rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50"
        >
          {loading ? 'Inviting…' : 'Send Invite'}
        </button>
      </form>
    </aside>
  )
}
