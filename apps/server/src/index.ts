import express from 'express'
import { createServer } from 'http'
import cors from 'cors'
import helmet from 'helmet'
import { Server } from 'socket.io'
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  SocketData,
} from './lib/types.js'

import { authRouter } from './routes/auth.js'
import { snippetsRouter } from './routes/snippets.js'
import { tagsRouter } from './routes/tags.js'
import { foldersRouter } from './routes/folders.js'
import { errorHandler } from './middleware/errorHandler.js'
import { authenticate } from './middleware/authenticate.js'
import { registerSnippetSocket } from './socket/snippetSocket.js'

const app = express()
const httpServer = createServer(app)

// ── Socket.io ────────────────────────────────────────────────────────────────
export const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>(httpServer, {
  cors: { origin: process.env['CLIENT_URL'] ?? 'http://localhost:5173' },
})

registerSnippetSocket(io)

// ── Express middleware ────────────────────────────────────────────────────────
app.use(helmet())
app.use(cors({ origin: process.env['CLIENT_URL'] ?? 'http://localhost:5173' }))
app.use(express.json())

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter)
app.use('/api/snippets', authenticate, snippetsRouter)
app.use('/api/tags', authenticate, tagsRouter)
app.use('/api/folders', authenticate, foldersRouter)

app.get('/health', (_req, res) => res.json({ ok: true }))

// ── Error handler ─────────────────────────────────────────────────────────────
app.use(errorHandler)

const PORT = Number(process.env['PORT'] ?? 4000)
httpServer.listen(PORT, () => {
  console.log(`🚀  Server running on http://localhost:${PORT}`)
})
