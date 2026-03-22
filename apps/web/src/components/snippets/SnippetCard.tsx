import { useNavigate } from 'react-router-dom'
import type { SnippetSummary } from '@dev-sync/types'
import { useSnippetStore } from '@/stores/snippetStore'
import { useState } from 'react'

const LANG_STYLE: Record<string, { bg: string; fg: string; label: string }> = {
  typescript:  { bg: 'rgba(77,201,255,0.12)',  fg: '#4dc9ff', label: 'TS'   },
  javascript:  { bg: 'rgba(255,202,58,0.12)',  fg: '#ffca3a', label: 'JS'   },
  python:      { bg: 'rgba(255,107,107,0.12)', fg: '#ff6b6b', label: 'PY'   },
  go:          { bg: 'rgba(255,202,58,0.12)',  fg: '#ffca3a', label: 'GO'   },
  rust:        { bg: 'rgba(255,107,107,0.12)', fg: '#ff6b6b', label: 'RS'   },
  sql:         { bg: 'rgba(79,255,176,0.10)',  fg: '#4fffb0', label: 'SQL'  },
  bash:        { bg: 'rgba(167,139,250,0.12)', fg: '#a78bfa', label: 'SH'   },
  json:        { bg: 'rgba(79,255,176,0.10)',  fg: '#4fffb0', label: 'JSON' },
  yaml:        { bg: 'rgba(255,202,58,0.12)',  fg: '#ffca3a', label: 'YAML' },
  markdown:    { bg: 'rgba(167,139,250,0.12)', fg: '#a78bfa', label: 'MD'   },
  plaintext:   { bg: 'rgba(90,100,128,0.15)',  fg: '#5a6480', label: 'TXT'  },
}

function timeAgo(date: Date | string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (s < 60)    return 'just now'
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`
  return new Date(date).toLocaleDateString()
}

interface SnippetCardProps {
  snippet: SnippetSummary
  index: number
  listView?: boolean
}

export function SnippetCard({ snippet, index, listView }: SnippetCardProps) {
  const nav = useNavigate()
  const deleteSnippet = useSnippetStore((s) => s.deleteSnippet)
  const [deleting, setDeleting] = useState(false)

  const lang = LANG_STYLE[snippet.language] ?? {
    bg: 'rgba(90,100,128,0.15)', fg: '#5a6480',
    label: snippet.language.slice(0, 4).toUpperCase(),
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm(`Delete "${snippet.title}"?`)) return
    setDeleting(true)
    try { await deleteSnippet(snippet.id) }
    catch { setDeleting(false) }
  }

  if (listView) {
    return (
      <div
        onClick={() => nav(`/snippets/${snippet.id}`)}
        className="animate-fade-up card flex items-center gap-4 px-4 py-3 cursor-pointer
                   hover:border-border2 transition-all duration-150 hover:-translate-y-px
                   hover:shadow-lg hover:shadow-black/20 group"
        style={{ animationDelay: `${index * 35}ms`, opacity: deleting ? 0.4 : 1 }}
      >
        <div
          className="w-8 h-8 rounded-lg grid place-items-center flex-shrink-0 font-mono text-[10px] font-semibold"
          style={{ background: lang.bg, color: lang.fg }}
        >
          {lang.label}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-white truncate tracking-tight">{snippet.title}</p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {snippet.tags.slice(0, 2).map((t) => (
            <span
              key={t.id}
              className="font-mono text-[9px] font-medium px-2 py-0.5 rounded-full"
              style={{ background: t.color + '22', color: t.color }}
            >
              {t.name}
            </span>
          ))}
          <span className="font-mono text-[9px] text-dim whitespace-nowrap ml-2">
            {timeAgo(snippet.updatedAt)}
          </span>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-dim hover:text-accent3 w-6 h-6 grid place-items-center rounded hover:bg-accent3/10 ml-1"
          >
            ×
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={() => nav(`/snippets/${snippet.id}`)}
      className="animate-fade-up card overflow-hidden cursor-pointer group
                 hover:border-border2 transition-all duration-200
                 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-black/30"
      style={{
        animationDelay: `${index * 40}ms`,
        opacity: deleting ? 0.4 : 1,
      }}
    >
      {/* Color accent bar */}
      <div
        className="h-[2px] w-full opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: `linear-gradient(90deg, ${lang.fg}, transparent)` }}
      />

      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-xl grid place-items-center flex-shrink-0 font-mono text-[10px] font-bold transition-transform group-hover:scale-105"
          style={{ background: lang.bg, color: lang.fg }}
        >
          {lang.label}
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <p className="font-bold text-sm text-white truncate tracking-tight leading-tight">
            {snippet.title}
          </p>
          <p className="font-mono text-[10px] text-muted mt-0.5">{snippet.language}</p>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="opacity-0 group-hover:opacity-100 transition-all text-dim hover:text-accent3
                     w-6 h-6 grid place-items-center rounded-md hover:bg-accent3/10
                     disabled:cursor-not-allowed flex-shrink-0"
          title="Delete"
        >
          {deleting ? (
            <span className="w-3 h-3 border border-dim border-t-muted rounded-full" style={{ animation: 'spin 0.6s linear infinite' }} />
          ) : '×'}
        </button>
      </div>

      {/* Tags + timestamp */}
      <div className="px-4 pb-4 flex items-center gap-2">
        <div className="flex gap-1.5 flex-wrap flex-1 min-w-0">
          {snippet.tags.length === 0 ? (
            <span className="font-mono text-[9px] text-dim italic">no tags</span>
          ) : (
            snippet.tags.slice(0, 3).map((t) => (
              <span
                key={t.id}
                className="font-mono text-[9px] font-medium px-2 py-0.5 rounded-full"
                style={{ background: t.color + '22', color: t.color }}
              >
                {t.name}
              </span>
            ))
          )}
          {snippet.tags.length > 3 && (
            <span className="font-mono text-[9px] text-dim">
              +{snippet.tags.length - 3}
            </span>
          )}
        </div>
        <span className="font-mono text-[9px] text-dim whitespace-nowrap flex-shrink-0">
          {timeAgo(snippet.updatedAt)}
        </span>
      </div>
    </div>
  )
}
