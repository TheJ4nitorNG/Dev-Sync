import type { CursorPosition, ContentDelta, PeerState } from './collaboration'

// Events emitted by the CLIENT → server
export interface ClientToServerEvents {
  'snippet:join':   (snippetId: string) => void
  'snippet:leave':  (snippetId: string) => void
  'snippet:delta':  (snippetId: string, delta: ContentDelta) => void
  'cursor:move':    (snippetId: string, position: CursorPosition) => void
}

// Events emitted by the SERVER → client
export interface ServerToClientEvents {
  'snippet:delta':  (delta: ContentDelta) => void
  'peers:update':   (peers: PeerState[]) => void
  'cursor:update':  (userId: string, position: CursorPosition | null) => void
  'error':          (message: string) => void
}

// Per-socket server-side data
export interface SocketData {
  userId: string
  snippetId: string | null
}
