// ─────────────────────────────────────────────────────────────────────────────
// Inlined shared types — keeps the server self-contained during build.
// The canonical source remains packages/types (used by the web app).
// ─────────────────────────────────────────────────────────────────────────────

// ── User ─────────────────────────────────────────────────────────────────────
export interface User {
  id: string
  email: string
  avatarUrl: string | null
  createdAt: Date
}

export type PublicUser = Omit<User, 'createdAt'>

export interface UserSession {
  userId: string
  email: string
  iat: number
  exp: number
}

// ── Snippet ───────────────────────────────────────────────────────────────────
export const SUPPORTED_LANGUAGES = [
  'typescript', 'javascript', 'python', 'go', 'rust',
  'sql', 'bash', 'json', 'yaml', 'markdown', 'plaintext',
] as const

export type Language = (typeof SUPPORTED_LANGUAGES)[number]
export type CollaboratorRole = 'Editor' | 'Viewer'

export interface Tag { id: string; name: string; color: string }

export interface Collaborator {
  userId: string
  snippetId: string
  role: CollaboratorRole
  user: Pick<User, 'id' | 'email' | 'avatarUrl'>
}

export interface Folder { id: string; name: string; userId: string }

export interface Snippet {
  id: string; title: string; content: string; language: Language
  ownerId: string; folderId: string | null; createdAt: Date; updatedAt: Date
  tags: Tag[]; collaborators: Collaborator[]
  owner: Pick<User, 'id' | 'email' | 'avatarUrl'>
}

export interface CreateSnippetInput {
  title: string; content: string; language: Language
  folderId?: string; tagIds?: string[]
}

export interface UpdateSnippetInput {
  title?: string; content?: string; language?: Language
  folderId?: string | null; tagIds?: string[]
}

// ── Collaboration ─────────────────────────────────────────────────────────────
export interface CursorPosition { lineNumber: number; column: number }

export const PEER_COLORS = [
  '#a78bfa', '#4dc9ff', '#ffca3a', '#ff6b6b', '#34d399', '#f472b6',
] as const

export type PeerColor = (typeof PEER_COLORS)[number]

export interface PeerState {
  userId: string; user: PublicUser
  cursor: CursorPosition | null; color: PeerColor; joinedAt: string
}

export interface ContentDelta { update: string; origin: string }

// ── Socket events ─────────────────────────────────────────────────────────────
export interface ClientToServerEvents {
  'snippet:join':  (snippetId: string) => void
  'snippet:leave': (snippetId: string) => void
  'snippet:delta': (snippetId: string, delta: ContentDelta) => void
  'cursor:move':   (snippetId: string, position: CursorPosition) => void
}

export interface ServerToClientEvents {
  'snippet:delta': (delta: ContentDelta) => void
  'peers:update':  (peers: PeerState[]) => void
  'cursor:update': (userId: string, position: CursorPosition | null) => void
  'error':         (message: string) => void
}

export interface SocketData { userId: string; snippetId: string | null }
