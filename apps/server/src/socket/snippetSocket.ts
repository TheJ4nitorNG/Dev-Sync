import type { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  SocketData,
  UserSession,
  PeerState,
  PeerColor,
} from '@dev-sync/types'
import { PEER_COLORS } from '@dev-sync/types'
import { prisma } from '../lib/prisma.js'

type AppServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>

// snippetId → Map<socketId, { userId, color, joinedAt }>
const rooms = new Map<
  string,
  Map<string, { userId: string; color: PeerColor; joinedAt: string }>
>()

// userId → cursor position (per snippet, stored on socket.data would be cleaner
// but keeping it simple here with a nested map)
const cursors = new Map<string, Map<string, { lineNumber: number; column: number }>>()
// cursors: snippetId → Map<userId, CursorPosition>

function assignColor(snippetId: string): PeerColor {
  const room = rooms.get(snippetId)
  const usedColors = new Set(room ? [...room.values()].map((p) => p.color) : [])
  return PEER_COLORS.find((c) => !usedColors.has(c)) ?? PEER_COLORS[0]!
}

export function registerSnippetSocket(io: AppServer) {
  // ── JWT auth middleware ────────────────────────────────────────────────────
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
    socket.on('snippet:join', async (snippetId) => {
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
    socket.on('snippet:leave', async (snippetId) => {
      socket.leave(snippetId)
      rooms.get(snippetId)?.delete(socket.id)
      if (rooms.get(snippetId)?.size === 0) {
        rooms.delete(snippetId)
        cursors.delete(snippetId)
      }
      await broadcastPeers(io, snippetId)
    })

    // ── snippet:delta — forward Yjs CRDT update, also persist to DB ───────
    socket.on('snippet:delta', async (snippetId, delta) => {
      // Broadcast to all OTHER clients in the room
      socket.to(snippetId).emit('snippet:delta', delta)

      // Decode and persist the latest content so new joiners get current state
      // In production you'd use a proper Yjs persistence provider (y-leveldb etc.)
      // Here we reconstruct via the delta and write content to the snippet row
      try {
        const Y = await import('yjs')
        const ydoc = new Y.Doc()
        const updateBytes = Buffer.from(delta.update, 'base64')
        Y.applyUpdate(ydoc, updateBytes)
        const content = ydoc.getText('content').toString()
        if (content) {
          await prisma.snippet.update({
            where: { id: snippetId },
            data: { content },
          })
        }
      } catch {
        // Non-fatal — client always has the authoritative Yjs state
      }
    })

    // ── cursor:move ────────────────────────────────────────────────────────
    socket.on('cursor:move', (snippetId, position) => {
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
  if (!room) {
    io.to(snippetId).emit('peers:update', [])
    return
  }

  // Collect unique userIds (one user may have multiple tabs open)
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
