import type { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  SocketData,
  UserSession,
  PeerState,
  PeerColor,
  ContentDelta,
  CursorPosition,
} from '@dev-sync/types'
import { PEER_COLORS } from '@dev-sync/types'
import { prisma } from '../lib/prisma.js'
 
type AppServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>
 
const rooms = new Map<
  string,
  Map<string, { userId: string; color: PeerColor; joinedAt: string }>
>()
 
const cursors = new Map<string, Map<string, CursorPosition>>()
 
function assignColor(snippetId: string): PeerColor {
  const room = rooms.get(snippetId)
  const usedColors = new Set(room ? [...room.values()].map((p) => p.color) : [])
  return PEER_COLORS.find((c: PeerColor) => !usedColors.has(c)) ?? PEER_COLORS[0]!
}
 
export function registerSnippetSocket(io: AppServer) {
  io.use((socket, next) => {
    const token = socket.handshake.auth['token'] as string | undefined
    if (!token) return next(new Error('Unauthorized'))
    try {
      const secret = process.env['JWT_SECRET'] ?? 'dev-secret-change-me'
      const session = jwt.verify(token, secret) as UserSession
      socket.data.userId = session.userId
      socket.data.snippetId = null
      next()
    } catch {
      next(new Error('Unauthorized'))
    }
  })
 
  io.on('connection', (socket) => {
    const { userId } = socket.data
 
    // ── snippet:join ───────────────────────────────────────────────────────
    socket.on('snippet:join', async (snippetId: string) => {
      const snippet = await prisma.snippet.findFirst({
        where: {
          id: snippetId,
          OR: [{ ownerId: userId }, { collaborators: { some: { userId } } }],
        },
        select: { id: true },
      })
      if (!snippet) { socket.emit('error', 'Access denied'); return }
 
      socket.join(snippetId)
      socket.data.snippetId = snippetId
 
      if (!rooms.has(snippetId)) rooms.set(snippetId, new Map())
      rooms.get(snippetId)!.set(socket.id, {
        userId,
        color: assignColor(snippetId),
        joinedAt: new Date().toISOString(),
      })
 
      await broadcastPeers(io, snippetId)
    })
 
    // ── snippet:leave ──────────────────────────────────────────────────────
    socket.on('snippet:leave', async (snippetId: string) => {
      socket.leave(snippetId)
      rooms.get(snippetId)?.delete(socket.id)
      if (rooms.get(snippetId)?.size === 0) {
        rooms.delete(snippetId)
        cursors.delete(snippetId)
      }
      await broadcastPeers(io, snippetId)
    })
 
    // ── snippet:delta ──────────────────────────────────────────────────────
    socket.on('snippet:delta', async (snippetId: string, delta: ContentDelta) => {
      socket.to(snippetId).emit('snippet:delta', delta)
      try {
        const Y = await import('yjs')
        const ydoc = new Y.Doc()
        Y.applyUpdate(ydoc, Buffer.from(delta.update, 'base64'))
        const content = ydoc.getText('content').toString()
        if (content) {
          await prisma.snippet.update({ where: { id: snippetId }, data: { content } })
        }
      } catch {
        // Non-fatal
      }
    })
 
    // ── cursor:move ────────────────────────────────────────────────────────
    socket.on('cursor:move', (snippetId: string, position: CursorPosition) => {
      if (!cursors.has(snippetId)) cursors.set(snippetId, new Map())
      cursors.get(snippetId)!.set(userId, position)
      socket.to(snippetId).emit('cursor:update', userId, position)
    })
 
    // ── disconnect ─────────────────────────────────────────────────────────
    socket.on('disconnect', async () => {
      const { snippetId } = socket.data
      if (!snippetId) return
      rooms.get(snippetId)?.delete(socket.id)
      cursors.get(snippetId)?.delete(userId)
      if (rooms.get(snippetId)?.size === 0) {
        rooms.delete(snippetId)
        cursors.delete(snippetId)
      }
      await broadcastPeers(io, snippetId)
    })
  })
}
 
async function broadcastPeers(io: AppServer, snippetId: string) {
  const room = rooms.get(snippetId)
  if (!room) { io.to(snippetId).emit('peers:update', []); return }
 
  const peerMap = new Map<string, { color: PeerColor; joinedAt: string }>()
  for (const { userId, color, joinedAt } of room.values()) {
    if (!peerMap.has(userId)) peerMap.set(userId, { color, joinedAt })
  }
 
  const userIds = [...peerMap.keys()]
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, email: true, avatarUrl: true },
  })
 
  const snippetCursors = cursors.get(snippetId)
  const peers: PeerState[] = users.map((u) => ({
    userId: u.id,
    user: u,
    cursor: snippetCursors?.get(u.id) ?? null,
    color: peerMap.get(u.id)!.color,
    joinedAt: peerMap.get(u.id)!.joinedAt,
  }))
 
  io.to(snippetId).emit('peers:update', peers)
}
