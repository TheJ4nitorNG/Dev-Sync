import { useEffect } from 'react'
import type * as Monaco from 'monaco-editor'

export const THEMES = [
  { id: 'vs-dark',    label: 'VS Dark',       dot: '#4dc9ff' },
  { id: 'hc-black',   label: 'High Contrast', dot: '#ffffff' },
  { id: 'dracula',    label: 'Dracula',        dot: '#bd93f9' },
  { id: 'solarized',  label: 'Solarized',      dot: '#b58900' },
  { id: 'nord',       label: 'Nord',           dot: '#88c0d0' },
]

const DRACULA_THEME: Monaco.editor.IStandaloneThemeData = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment',    foreground: '6272a4', fontStyle: 'italic' },
    { token: 'keyword',    foreground: 'ff79c6' },
    { token: 'string',     foreground: 'f1fa8c' },
    { token: 'number',     foreground: 'bd93f9' },
    { token: 'type',       foreground: '8be9fd' },
    { token: 'function',   foreground: '50fa7b' },
    { token: 'variable',   foreground: 'f8f8f2' },
    { token: 'operator',   foreground: 'ff79c6' },
  ],
  colors: {
    'editor.background':          '#282a36',
    'editor.foreground':          '#f8f8f2',
    'editor.lineHighlightBackground': '#44475a55',
    'editorLineNumber.foreground':    '#6272a4',
    'editorCursor.foreground':        '#f8f8f2',
    'editor.selectionBackground':     '#44475a',
    'editorGutter.background':        '#282a36',
  },
}

const SOLARIZED_THEME: Monaco.editor.IStandaloneThemeData = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment',  foreground: '657b83', fontStyle: 'italic' },
    { token: 'keyword',  foreground: '859900' },
    { token: 'string',   foreground: '2aa198' },
    { token: 'number',   foreground: 'd33682' },
    { token: 'type',     foreground: 'b58900' },
    { token: 'function', foreground: '268bd2' },
    { token: 'variable', foreground: '839496' },
  ],
  colors: {
    'editor.background':          '#002b36',
    'editor.foreground':          '#839496',
    'editor.lineHighlightBackground': '#073642',
    'editorLineNumber.foreground':    '#586e75',
    'editorCursor.foreground':        '#839496',
    'editor.selectionBackground':     '#073642',
    'editorGutter.background':        '#002b36',
  },
}

const NORD_THEME: Monaco.editor.IStandaloneThemeData = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment',  foreground: '4c566a', fontStyle: 'italic' },
    { token: 'keyword',  foreground: '81a1c1' },
    { token: 'string',   foreground: 'a3be8c' },
    { token: 'number',   foreground: 'b48ead' },
    { token: 'type',     foreground: '8fbcbb' },
    { token: 'function', foreground: '88c0d0' },
    { token: 'variable', foreground: 'd8dee9' },
  ],
  colors: {
    'editor.background':          '#2e3440',
    'editor.foreground':          '#d8dee9',
    'editor.lineHighlightBackground': '#3b4252',
    'editorLineNumber.foreground':    '#4c566a',
    'editorCursor.foreground':        '#d8dee9',
    'editor.selectionBackground':     '#434c5e',
    'editorGutter.background':        '#2e3440',
  },
}

export function registerCustomThemes(monaco: typeof Monaco) {
  monaco.editor.defineTheme('dracula',   DRACULA_THEME)
  monaco.editor.defineTheme('solarized', SOLARIZED_THEME)
  monaco.editor.defineTheme('nord',      NORD_THEME)
}

interface ThemeSwitcherProps {
  value: string
  onChange: (theme: string) => void
}

export function ThemeSwitcher({ value, onChange }: ThemeSwitcherProps) {
  const current = THEMES.find((t) => t.id === value) ?? THEMES[0]!

  return (
    <div className="relative group">
      <button className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-1.5 text-[10px] font-mono text-muted hover:text-white hover:border-border2 transition-all">
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: current.dot }} />
        {current.label}
        <span className="text-dim">▾</span>
      </button>

      {/* Dropdown */}
      <div className="absolute top-full right-0 mt-1.5 bg-card border border-border rounded-xl overflow-hidden shadow-2xl shadow-black/50 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all z-50 min-w-[140px]">
        {THEMES.map((t) => (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-[11px] font-bold transition-colors text-left ${
              value === t.id
                ? 'bg-accent/10 text-accent'
                : 'text-muted hover:bg-surface hover:text-white'
            }`}
          >
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: t.dot }}
            />
            {t.label}
            {value === t.id && <span className="ml-auto text-accent text-xs">✓</span>}
          </button>
        ))}
      </div>
    </div>
  )
}
