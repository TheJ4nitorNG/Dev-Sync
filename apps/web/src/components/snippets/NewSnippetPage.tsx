import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import MonacoEditor, { type OnMount } from '@monaco-editor/react'
import { SUPPORTED_LANGUAGES, type Language } from '@dev-sync/types'
import { useSnippetStore } from '@/stores/snippetStore'
import { api } from '@/lib/api'

const LANG_PLACEHOLDER: Partial<Record<Language, string>> = {
  typescript: `// Start with a type-safe interface
interface User {
  id: string
  email: string
  createdAt: Date
}

export function greet(user: User): string {
  return \`Hello, \${user.email}!\`
}`,
  python: `# A quick Python snippet
def fibonacci(n: int) -> list[int]:
    a, b = 0, 1
    result = []
    for _ in range(n):
        result.append(a)
        a, b = b, a + b
    return result`,
  go: `// Go snippet
package main

import "fmt"

func main() {
    fmt.Println("Hello, DevSync!")
}`,
  sql: `-- SQL snippet
SELECT
  u.email,
  COUNT(s.id) AS snippet_count
FROM users u
LEFT JOIN snippets s ON s.owner_id = u.id
GROUP BY u.email
ORDER BY snippet_count DESC;`,
}

const LANG_STYLE: Record<string, { fg: string }> = {
  typescript: { fg: '#4dc9ff' }, javascript: { fg: '#ffca3a' },
  python:     { fg: '#ff6b6b' }, go:         { fg: '#ffca3a' },
  rust:       { fg: '#ff6b6b' }, sql:        { fg: '#4fffb0' },
  bash:       { fg: '#a78bfa' }, json:       { fg: '#4fffb0' },
}

export function NewSnippetPage() {
  const [title, setTitle]       = useState('')
  const [language, setLanguage] = useState<Language>('typescript')
  const [content, setContent]   = useState(LANG_PLACEHOLDER.typescript ?? '')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [step, setStep]         = useState<1 | 2>(1)
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null)
  const createSnippet = useSnippetStore((s) => s.createSnippet)
  const nav = useNavigate()

  const handleLangChange = (l: Language) => {
    setLanguage(l)
    if (!content || content === LANG_PLACEHOLDER[language]) {
      setContent(LANG_PLACEHOLDER[l] ?? '')
    }
  }

  const handleMount: OnMount = (editor) => {
    editorRef.current = editor
  }

  const proceed = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) { setError('Title is required'); return }
    setError('')
    setStep(2)
  }

  const submit = async () => {
    const finalContent = editorRef.current?.getValue() ?? content
    if (!finalContent.trim()) { setError('Add some content first'); return }
    setLoading(true)
    try {
      const sn = await createSnippet({ title, language, content: finalContent })
      nav(`/snippets/${sn.id}`)
    } catch {
      setError('Failed to create snippet')
      setLoading(false)
    }
  }

  const langColor = LANG_STYLE[language]?.fg ?? '#5a6480'

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">

      {/* ── Topbar ── */}
      <header className="flex-shrink-0 bg-surface border-b border-border px-6 h-14 flex items-center gap-4">
        <button
          onClick={() => step === 2 ? setStep(1) : nav(-1)}
          className="text-muted text-xs font-mono hover:text-white transition-colors flex items-center gap-1.5"
        >
          ← {step === 2 ? 'Back to details' : 'Back'}
        </button>

        {/* Progress steps */}
        <div className="flex items-center gap-2 flex-1 justify-center">
          {[
            { n: 1, label: 'Details' },
            { n: 2, label: 'Content' },
          ].map(({ n, label }) => (
            <div key={n} className="flex items-center gap-2">
              <div className={`flex items-center gap-2 transition-colors ${step >= n ? 'text-accent' : 'text-dim'}`}>
                <div className={`w-5 h-5 rounded-full grid place-items-center text-[10px] font-black border transition-all ${
                  step > n
                    ? 'bg-accent border-accent text-black'
                    : step === n
                      ? 'border-accent text-accent'
                      : 'border-border text-dim'
                }`}>
                  {step > n ? '✓' : n}
                </div>
                <span className="font-mono text-[10px] font-medium">{label}</span>
              </div>
              {n < 2 && (
                <div className={`w-8 h-px transition-colors ${step > n ? 'bg-accent' : 'bg-border'}`} />
              )}
            </div>
          ))}
        </div>

        {step === 2 && (
          <button
            onClick={submit}
            disabled={loading}
            className="btn-accent px-5 py-2 text-xs disabled:opacity-60"
          >
            {loading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full"
                  style={{ animation: 'spin 0.7s linear infinite' }} />
                Creating…
              </>
            ) : 'Create Snippet →'}
          </button>
        )}
      </header>

      {/* ── Step 1: Details ── */}
      {step === 1 && (
        <div className="flex-1 flex items-start justify-center pt-16 px-8 animate-scale-in">
          <div className="w-full max-w-lg">
            <div className="mb-8">
              <p className="font-mono text-[10px] text-muted uppercase tracking-widest mb-2">Step 1 of 2</p>
              <h1 className="text-2xl font-extrabold tracking-tight">New Snippet</h1>
              <p className="text-muted font-mono text-xs mt-1.5">Name it and pick the language.</p>
            </div>

            <form onSubmit={proceed} className="flex flex-col gap-5">
              {error && (
                <div className="bg-accent3/10 border border-accent3/30 rounded-lg px-4 py-3 animate-scale-in">
                  <p className="text-accent3 text-xs font-mono">{error}</p>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <label className="font-mono text-[10px] text-muted uppercase tracking-widest">
                  Title
                </label>
                <input
                  className="input-base text-base font-extrabold tracking-tight"
                  placeholder="e.g. useSocketSync Hook"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              {/* Language picker — visual grid */}
              <div className="flex flex-col gap-2">
                <label className="font-mono text-[10px] text-muted uppercase tracking-widest">
                  Language
                </label>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {SUPPORTED_LANGUAGES.map((l) => {
                    const fg = LANG_STYLE[l]?.fg ?? '#5a6480'
                    return (
                      <button
                        key={l}
                        type="button"
                        onClick={() => handleLangChange(l)}
                        className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition-all duration-150 text-left ${
                          language === l
                            ? 'border-current'
                            : 'bg-card border-border text-muted hover:border-border2 hover:text-white'
                        }`}
                        style={language === l ? {
                          color: fg,
                          borderColor: fg,
                          background: fg + '14',
                        } : {}}
                      >
                        {l}
                      </button>
                    )
                  })}
                </div>
              </div>

              <button
                type="submit"
                className="btn-accent py-3 text-sm mt-2"
              >
                Continue to Editor →
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Step 2: Editor ── */}
      {step === 2 && (
        <div className="flex-1 flex flex-col overflow-hidden animate-fade-in">
          {/* Editor chrome bar */}
          <div className="flex-shrink-0 bg-surface border-b border-border px-5 py-2.5 flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-accent3/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-accent4/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-accent/50" />
            </div>
            <span className="font-mono text-[11px] text-muted flex-1">
              <span style={{ color: langColor }} className="font-semibold">{title}</span>
              <span className="text-dim"> · {language}</span>
            </span>
            {error && (
              <span className="text-accent3 text-[10px] font-mono">{error}</span>
            )}
          </div>

          <MonacoEditor
            height="100%"
            language={language}
            theme="vs-dark"
            defaultValue={content}
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
              bracketPairColorization: { enabled: true },
            }}
          />
        </div>
      )}
    </div>
  )
}
