import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useSnippetStore } from '@/stores/snippetStore'
import { SnippetCard } from './SnippetCard'
import { SUPPORTED_LANGUAGES, type Language } from '@dev-sync/types'
import { useAuthStore } from '@/stores/authStore'

type LangFilter = Language | 'all'

const STAT_CARDS = [
  { label: 'Total Snippets', key: 'total',   color: '#4fffb0' },
  { label: 'Languages',      key: 'langs',   color: '#4dc9ff' },
  { label: 'Tags Used',      key: 'tags',    color: '#a78bfa' },
  { label: 'Shared',         key: 'shared',  color: '#ffca3a' },
]

function useDebounce<T>(value: T, ms: number) {
  const [dv, setDv] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDv(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return dv
}

export function DashboardPage() {
  const { snippets, loading, fetchSnippets } = useSnippetStore()
  const { email } = useAuthStore()
  const nav = useNavigate()
  const location = useLocation()

  const [search, setSearch]       = useState('')
  const [lang, setLang]           = useState<LangFilter>('all')
  const [view, setView]           = useState<'grid' | 'list'>('grid')
  const debouncedSearch           = useDebounce(search, 280)

  const folderParam = new URLSearchParams(location.search).get('folder') ?? undefined

  const load = useCallback(() => {
    const params: Parameters<typeof fetchSnippets>[0] = {}
    if (debouncedSearch) params.q = debouncedSearch
    if (lang !== 'all')  params.language = lang
    if (folderParam)     params.folder = folderParam
    fetchSnippets(params)
  }, [debouncedSearch, lang, folderParam, fetchSnippets])

  useEffect(() => { load() }, [load])

  // Stats derived from loaded snippets
  const stats = {
    total:  snippets.length,
    langs:  new Set(snippets.map((s) => s.language)).size,
    tags:   new Set(snippets.flatMap((s) => s.tags.map((t) => t.id))).size,
    shared: snippets.filter((s) => s.tags.length > 0).length, // placeholder
  }

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const firstName = email?.split('@')[0] ?? 'dev'

  return (
    <div className="flex-1 flex flex-col min-h-screen">

      {/* ── Topbar ── */}
      <header className="sticky top-0 z-10 bg-bg/90 backdrop-blur-md border-b border-border px-7 h-14 flex items-center gap-4 flex-shrink-0">
        {/* Search */}
        <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 h-8 w-60 focus-within:border-accent transition-all duration-200 focus-within:shadow-[0_0_0_3px_rgba(79,255,176,0.08)]">
          <svg className="w-3 h-3 text-dim flex-shrink-0" viewBox="0 0 14 14" fill="currentColor">
            <path d="M6 0a6 6 0 104.47 10L13 12.47 12.47 13 10 10.47A6 6 0 006 0zm0 1.5a4.5 4.5 0 110 9 4.5 4.5 0 010-9z"/>
          </svg>
          <input
            type="text"
            placeholder="Search snippets…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-xs font-mono outline-none flex-1 text-white placeholder-dim"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="text-dim hover:text-muted transition-colors text-sm leading-none"
            >
              ×
            </button>
          )}
        </div>

        <div className="flex-1" />

        {/* View toggle */}
        <div className="flex items-center bg-card border border-border rounded-lg p-0.5 gap-0.5">
          {(['grid', 'list'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${
                view === v
                  ? 'bg-accent/10 text-accent'
                  : 'text-dim hover:text-muted'
              }`}
            >
              {v === 'grid' ? '⊞' : '≡'}
            </button>
          ))}
        </div>

        <button
          onClick={() => nav('/snippets/new')}
          className="btn-accent px-4 py-2 text-xs"
        >
          <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
            <path d="M6 0v12M0 6h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          New Snippet
        </button>
      </header>

      <div className="flex-1 px-7 py-6 flex flex-col gap-6 overflow-auto">

        {/* ── Greeting + stats ── */}
        {!debouncedSearch && lang === 'all' && !folderParam && (
          <div className="animate-fade-up">
            <p className="text-muted font-mono text-xs mb-1">{greeting()},</p>
            <h1 className="text-xl font-extrabold tracking-tight mb-5">
              {firstName}<span className="text-accent">.</span>
            </h1>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 stagger">
              {STAT_CARDS.map((card) => (
                <div
                  key={card.key}
                  className="animate-fade-up card p-4 relative overflow-hidden"
                >
                  <div
                    className="absolute top-0 left-0 right-0 h-[2px]"
                    style={{ background: card.color }}
                  />
                  <p className="font-mono text-[9px] text-muted uppercase tracking-widest mb-2">
                    {card.label}
                  </p>
                  <p
                    className="text-2xl font-extrabold tracking-tight"
                    style={{ color: card.color }}
                  >
                    {stats[card.key as keyof typeof stats]}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Language filter tabs ── */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none animate-fade-in pb-0.5">
          {(['all', ...SUPPORTED_LANGUAGES] as LangFilter[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`flex-shrink-0 font-mono text-[10px] font-medium px-3 py-1.5 rounded-lg border transition-all duration-150 ${
                lang === l
                  ? 'bg-accent/10 text-accent border-accent/30'
                  : 'bg-card text-dim border-border hover:text-muted hover:border-border2'
              }`}
            >
              {l === 'all' ? 'All' : l}
            </button>
          ))}
        </div>

        {/* ── Snippets ── */}
        {loading && snippets.length === 0 ? (
          /* Skeleton loading */
          <div
            className={`grid gap-4 ${
              view === 'grid'
                ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
                : 'grid-cols-1 max-w-3xl'
            }`}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card overflow-hidden" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="p-4 flex gap-3 border-b border-border">
                  <div className="skeleton w-8 h-8 rounded-lg flex-shrink-0" />
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="skeleton h-3 rounded w-3/4" />
                    <div className="skeleton h-2.5 rounded w-1/2" />
                  </div>
                </div>
                <div className="p-4 flex gap-2">
                  <div className="skeleton h-4 rounded-full w-12" />
                  <div className="skeleton h-4 rounded-full w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : snippets.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 animate-scale-in">
            <div className="w-20 h-20 rounded-3xl bg-card border border-border grid place-items-center mb-5">
              <span className="text-3xl">{'</>'}</span>
            </div>
            <p className="font-extrabold text-base tracking-tight mb-1.5">
              {debouncedSearch || lang !== 'all'
                ? 'No snippets match'
                : 'No snippets yet'}
            </p>
            <p className="text-muted font-mono text-xs mb-6">
              {debouncedSearch
                ? `Nothing found for "${debouncedSearch}"`
                : lang !== 'all'
                  ? `No ${lang} snippets found`
                  : 'Create your first snippet to get started'}
            </p>
            {!debouncedSearch && lang === 'all' && (
              <button
                onClick={() => nav('/snippets/new')}
                className="btn-accent px-6 py-2.5 text-sm"
              >
                + Create Snippet
              </button>
            )}
          </div>
        ) : (
          <div
            className={`grid gap-3 stagger ${
              view === 'grid'
                ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
                : 'grid-cols-1 max-w-3xl'
            }`}
          >
            {snippets.map((sn, i) => (
              <SnippetCard key={sn.id} snippet={sn} index={i} listView={view === 'list'} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
