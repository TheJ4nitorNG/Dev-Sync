import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import MonacoEditor, { type OnMount, useMonaco } from '@monaco-editor/react'
import * as Y from 'yjs'
import { useSnippetStore } from '@/stores/snippetStore'
import { useSocketSync } from '@/hooks/useSocketSync'
import { api } from '@/lib/api'
import type { Language } from '@dev-sync/types'
import { SUPPORTED_LANGUAGES } from '@dev-sync/types'
import { CollaboratorPanel } from './CollaboratorPanel'
import { ThemeSwitcher, registerCustomThemes } from './ThemeSwitcher'

export function SnippetPage() {
  const { id }  = useParams<{ id: string }>()
  const nav     = useNavigate()
  const monaco  = useMonaco()

  const { activeSnippet, loading, fetchSnippet } = useSnippetStore()
  const ydoc    = useRef(new Y.Doc()).current
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null)

  const [theme, setTheme]               = useState('vs-dark')
  const [language, setLanguage]         = useState<Language>('typescript')
  const [saving, setSaving]             = useState(false)
  const [saveMsg, setSaveMsg]           = useState('')
  const [showCollabPanel, setShowCollab] = useState(false)
  const [seeded, setSeeded]             = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Register custom Monaco themes once monaco is ready
  useEffect(() => {
    if (monaco) registerCustomThemes(monaco)
  }, [monaco])

  useEffect(() => {
    if (id) fetchSnippet(id)
  }, [id, fetchSnippet])

  // Seed Yjs once, and only once, from DB content
  useEffect(() => {
    if (!activeSnippet || seeded) return
    const yText = ydoc.getText('content')
    if (yText.length === 0) {
      ydoc.transact(() => yText.insert(0, activeSnippet.content), 'seed')
    }
    setLanguage(activeSnippet.language as Language)
    setSeeded(true)
  }, [activeSnippet?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const { connected, peers, moveCursor } = useSocketSync({
    snippetId: id ?? '',
    ydoc,
    editorRef,
  })

  // ── Debounced auto-save ───────────────────────────────────────────────────
  const triggerSave = useCallback(() => {
    if (!id) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      try {
        setSaving(true)
        const content = editorRef.current?.getValue() ?? ydoc.getText('content').toString()
        await api.snippets.update(id, { content, language })
        setSaveMsg('Saved')
        setTimeout(() => setSaveMsg(''), 2500)
      } catch {
        setSaveMsg('⚠ Save failed')
      } finally {
        setSaving(false)
      }
    }, 1500)
  }, [id, language])

  const handleMount: OnMount = (editor) => {
    editorRef.current = editor

    // Cursor tracking → Socket
    editor.onDidChangeCursorPosition((e) => {
      moveCursor(e.position.lineNumber, e.position.column)
    })

    // Content change → auto-save
    editor.onDidChangeModelContent(() => {
      triggerSave()
    })

    // Cmd/Ctrl+S → immediate save
    editor.addCommand(2048 | 49, async () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
      if (!id) return
      setSaving(true)
      try {
        await api.snippets.update(id, { content: editor.getValue(), language })
        setSaveMsg('Saved')
        setTimeout(() => setSaveMsg(''), 2500)
      } catch {
        setSaveMsg('⚠ Save failed')
      } finally { setSaving(false) }
    })
  }

  if (loading && !activeSnippet) {
    return (
      <div className="flex-1 grid place-items-center">
        <div className="flex flex-col items-center gap-3 animate-fade-in">
          <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full"
            style={{ animation: 'spin 0.8s linear infinite' }} />
          <p className="text-muted font-mono text-xs">Loading snippet…</p>
        </div>
      </div>
    )
  }

  if (!activeSnippet) {
    return (
      <div className="flex-1 grid place-items-center animate-fade-in">
        <div className="text-center">
          <p className="text-2xl mb-3">🔍</p>
          <p className="font-bold text-sm mb-1">Snippet not found</p>
          <button onClick={() => nav('/')} className="text-accent text-xs font-mono underline underline-offset-2 mt-2">
            ← Back to dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">

      {/* ── Top bar ── */}
      <header className="flex-shrink-0 bg-surface border-b border-border h-14 px-5 flex items-center gap-3">
        {/* Back */}
        <button
          onClick={() => nav('/')}
          className="text-dim hover:text-white transition-colors text-xs font-mono flex items-center gap-1.5 flex-shrink-0"
        >
          ←
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-border flex-shrink-0" />

        {/* Title */}
        <h1 className="font-extrabold text-sm tracking-tight truncate flex-1 min-w-0">
          {activeSnippet.title}
        </h1>

        {/* Language */}
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as Language)}
          className="bg-card border border-border text-[10px] font-mono rounded-lg px-2.5 py-1.5 text-muted outline-none focus:border-accent transition-colors flex-shrink-0"
        >
          {SUPPORTED_LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>

        {/* Save indicator */}
        <div className="flex items-center gap-1.5 min-w-[60px] flex-shrink-0">
          {saving && (
            <span className="w-3 h-3 border border-accent/30 border-t-accent rounded-full flex-shrink-0"
              style={{ animation: 'spin 0.7s linear infinite' }} />
          )}
          {saveMsg && (
            <span className={`font-mono text-[10px] whitespace-nowrap animate-fade-in ${
              saveMsg.startsWith('⚠') ? 'text-accent3' : 'text-accent'
            }`}>
              {saveMsg}
            </span>
          )}
        </div>

        {/* Theme */}
        <ThemeSwitcher value={theme} onChange={setTheme} />

        {/* Invite */}
        <button
          onClick={() => setShowCollab((v) => !v)}
          className={`flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all ${
            showCollabPanel
              ? 'bg-accent/10 text-accent border-accent/30'
              : 'bg-card border-border text-muted hover:text-white hover:border-border2'
          }`}
        >
          <svg className="w-3 h-3" viewBox="0 0 14 14" fill="currentColor">
            <circle cx="5" cy="4" r="2.5"/>
            <path d="M0 12c0-2.8 2.2-5 5-5s5 2.2 5 5"/>
            <path d="M11 6v4M13 8h-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          {peers.length > 0 ? `${peers.length + 1} here` : 'Invite'}
        </button>

        {/* Collaborator avatars */}
        {peers.length > 0 && (
          <div className="flex -space-x-1.5 flex-shrink-0">
            {peers.slice(0, 4).map((p) => (
              <div
                key={p.userId}
                title={`${p.user.email}${p.cursor ? ` · Ln ${p.cursor.lineNumber}` : ''}`}
                className="w-6 h-6 rounded-full border-2 border-surface grid place-items-center text-[9px] font-black text-black"
                style={{ background: p.color }}
              >
                {p.user.email.slice(0, 2).toUpperCase()}
              </div>
            ))}
          </div>
        )}

        {/* Live indicator */}
        <div className={`flex items-center gap-1.5 font-mono text-[10px] px-2.5 py-1 rounded-full flex-shrink-0 transition-all ${
          connected
            ? 'bg-accent/10 text-accent border border-accent/20'
            : 'bg-surface text-dim border border-border'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-accent' : 'bg-dim'}`}
            style={connected ? { animation: 'glowPulse 1.4s ease-in-out infinite' } : {}} />
          {connected ? 'Live' : 'Offline'}
        </div>
      </header>

      {/* ── Editor + collab panel ── */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-hidden">
          <MonacoEditor
            height="100%"
            language={language}
            theme={theme}
            defaultValue={activeSnippet.content}
            onMount={handleMount}
            options={{
              fontSize: 13,
              fontFamily: "'Azeret Mono', monospace",
              fontLigatures: true,
              minimap: { enabled: false },
              padding: { top: 20, bottom: 20 },
              lineNumbers: 'on',
              renderLineHighlight: 'gutter',
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              tabSize: 2,
              automaticLayout: true,
              cursorBlinking: 'smooth',
              smoothScrolling: true,
              contextmenu: true,
              bracketPairColorization: { enabled: true },
              suggest: { preview: true },
            }}
          />
        </div>

        {showCollabPanel && (
          <div className="animate-slide-right">
            <CollaboratorPanel
              snippetId={id!}
              collaborators={activeSnippet.collaborators}
              onClose={() => setShowCollab(false)}
            />
          </div>
        )}
      </div>

      {/* ── Status bar ── */}
      <div className="flex-shrink-0 bg-surface border-t border-border px-5 py-1.5 flex items-center gap-5 overflow-x-auto scrollbar-none">
        <span className="font-mono text-[9px] text-dim flex-shrink-0">
          {language} · {activeSnippet.tags.map((t) => t.name).join(', ') || 'no tags'}
        </span>

        {peers.length > 0 && (
          <>
            <div className="w-px h-3 bg-border flex-shrink-0" />
            {peers.map((p) => (
              <span key={p.userId} className="flex items-center gap-1.5 font-mono text-[9px] flex-shrink-0">
                <span className="w-1.5 h-1.5 rounded-full"
                  style={{ background: p.color, animation: 'glowPulse 1.4s ease-in-out infinite' }} />
                <span style={{ color: p.color }}>{p.user.email.split('@')[0]}</span>
                {p.cursor && (
                  <span className="text-dim">Ln {p.cursor.lineNumber}</span>
                )}
              </span>
            ))}
          </>
        )}

        <div className="flex-1" />
        <span className="font-mono text-[9px] text-dim flex-shrink-0">
          {saving ? 'Saving…' : saveMsg || 'Auto-save on'}
        </span>
      </div>
    </div>
  )
}
