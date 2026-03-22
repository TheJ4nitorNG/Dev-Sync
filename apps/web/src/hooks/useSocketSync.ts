import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import * as Y from 'yjs'
import type * as monaco from 'monaco-editor'
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  PeerState,
  ContentDelta,
} from '@dev-sync/types'
import { useAuthStore } from '@/stores/authStore'

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>

export interface UseSocketSyncOptions {
  snippetId: string
  ydoc: Y.Doc
  editorRef: React.MutableRefObject<monaco.editor.IStandaloneCodeEditor | null>
}

export interface UseSocketSyncReturn {
  connected: boolean
  peers: PeerState[]
  moveCursor: (lineNumber: number, column: number) => void
}

export function useSocketSync({
  snippetId,
  ydoc,
  editorRef,
}: UseSocketSyncOptions): UseSocketSyncReturn {
  const token = useAuthStore((s) => s.token)
  const socketRef = useRef<AppSocket | null>(null)
  const [peers, setPeers] = useState<PeerState[]>([])
  const [connected, setConnected] = useState(false)

  // Track remote cursor decorations per userId
  const decorationsRef = useRef<Map<string, string[]>>(new Map())

  // Apply a remote peer's cursor as a Monaco decoration
  const applyRemoteCursor = useCallback(
    (userId: string, color: string, lineNumber: number, column: number) => {
      const editor = editorRef.current
      if (!editor) return

      const existing = decorationsRef.current.get(userId) ?? []
      const next = editor.deltaDecorations(existing, [
        {
          range: {
            startLineNumber: lineNumber,
            startColumn: column,
            endLineNumber: lineNumber,
            endColumn: column + 1,
          },
          options: {
            className: `peer-cursor-${userId.slice(0, 8)}`,
            beforeContentClassName: `peer-cursor-caret`,
            stickiness: 1, // NeverGrowsWhenTypingAtEdges
          },
        },
      ])

      // Inject dynamic CSS for this peer's color
      const styleId = `peer-cursor-style-${userId.slice(0, 8)}`
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style')
        style.id = styleId
        style.textContent = `
          .peer-cursor-${userId.slice(0, 8)} {
            border-left: 2px solid ${color};
            background: ${color}22;
          }
        `
        document.head.appendChild(style)
      }

      decorationsRef.current.set(userId, next)
    },
    [editorRef],
  )

  useEffect(() => {
    if (!token || !snippetId) return

    const socket: AppSocket = io({ auth: { token }, transports: ['websocket'] })
    socketRef.current = socket

    const yText = ydoc.getText('content')

    // ── Socket events ──────────────────────────────────────────────────────
    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))
    socket.on('error', (msg) => console.error('[socket]', msg))

    socket.on('peers:update', (incoming) => {
      setPeers(incoming)
      // Clear decorations for peers who left
      for (const [userId] of decorationsRef.current) {
        if (!incoming.find((p) => p.userId === userId)) {
          const editor = editorRef.current
          if (editor) editor.deltaDecorations(decorationsRef.current.get(userId) ?? [], [])
          decorationsRef.current.delete(userId)
        }
      }
    })

    socket.on('snippet:delta', (delta: ContentDelta) => {
      const update = new Uint8Array(Buffer.from(delta.update, 'base64'))
      Y.applyUpdate(ydoc, update, 'remote')
    })

    socket.on('cursor:update', (userId, position) => {
      if (!position) return
      const peer = peers.find((p) => p.userId === userId)
      applyRemoteCursor(userId, peer?.color ?? '#a78bfa', position.lineNumber, position.column)
    })

    socket.emit('snippet:join', snippetId)

    // ── Yjs → Monaco binding ───────────────────────────────────────────────
    // When Yjs text changes, push the delta into Monaco without creating
    // a feedback loop (Monaco onChange → Yjs → Monaco)
    let suppressMonacoChange = false

    yText.observe(() => {
      const editor = editorRef.current
      if (!editor) return
      const incoming = yText.toString()
      const current = editor.getValue()
      if (incoming === current) return
      suppressMonacoChange = true
      const pos = editor.getPosition()
      editor.setValue(incoming)
      if (pos) editor.setPosition(pos)
      suppressMonacoChange = false
    })

    // ── Monaco → Yjs binding ───────────────────────────────────────────────
    // Attach after editor mounts — polled via editorRef
    let monacoDispose: (() => void) | null = null

    const attachMonaco = () => {
      const editor = editorRef.current
      if (!editor) return
      const disposable = editor.onDidChangeModelContent(() => {
        if (suppressMonacoChange) return
        const newVal = editor.getValue()
        if (yText.toString() === newVal) return
        ydoc.transact(() => {
          yText.delete(0, yText.length)
          yText.insert(0, newVal)
        }, 'local')
      })
      monacoDispose = () => disposable.dispose()
    }

    // Monaco may not be mounted yet — retry until it is
    const attachInterval = setInterval(() => {
      if (editorRef.current) {
        attachMonaco()
        clearInterval(attachInterval)
      }
    }, 100)

    // ── Yjs → Socket.io: forward local updates ─────────────────────────────
    const handleYjsUpdate = (update: Uint8Array, origin: unknown) => {
      if (origin === 'remote') return
      const delta: ContentDelta = {
        update: Buffer.from(update).toString('base64'),
        origin: 'local',
      }
      socket.emit('snippet:delta', snippetId, delta)
    }

    ydoc.on('update', handleYjsUpdate)

    return () => {
      clearInterval(attachInterval)
      monacoDispose?.()
      socket.emit('snippet:leave', snippetId)
      socket.disconnect()
      ydoc.off('update', handleYjsUpdate)
      decorationsRef.current.clear()
    }
  }, [snippetId, token]) // eslint-disable-line react-hooks/exhaustive-deps

  const moveCursor = useCallback(
    (lineNumber: number, column: number) => {
      socketRef.current?.emit('cursor:move', snippetId, { lineNumber, column })
    },
    [snippetId],
  )

  return { connected, peers, moveCursor }
}
