import type { PublicUser } from './user'

export interface CursorPosition {
  lineNumber: number
  column: number
}

/** Assigned per-peer so each cursor renders a distinct color in the editor */
export const PEER_COLORS = [
  '#a78bfa', // purple
  '#4dc9ff', // blue
  '#ffca3a', // yellow
  '#ff6b6b', // red
  '#34d399', // green
  '#f472b6', // pink
] as const

export type PeerColor = (typeof PEER_COLORS)[number]

export interface PeerState {
  userId: string
  user: PublicUser
  cursor: CursorPosition | null
  color: PeerColor
  /** ISO string */
  joinedAt: string
}

export interface ContentDelta {
  /** Yjs update encoded as base64 */
  update: string
  origin: string
}
