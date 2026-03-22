import { Router } from 'express'
import { z } from 'zod'
import { SUPPORTED_LANGUAGES } from '@dev-sync/types'
import { prisma } from '../lib/prisma.js'
import type { AuthRequest } from '../middleware/authenticate.js'
 
export const snippetsRouter = Router()
 
const snippetSelect = {
  id: true,
  title: true,
  content: true,
  language: true,
  ownerId: true,
  folderId: true,
  createdAt: true,
  updatedAt: true,
  tags: { select: { tag: { select: { id: true, name: true, color: true } } } },
  collaborators: {
    select: {
      role: true,
      user: { select: { id: true, email: true, avatarUrl: true } },
    },
  },
  owner: { select: { id: true, email: true, avatarUrl: true } },
} as const
 
const createSchema = z.object({
  title:    z.string().min(1).max(120),
  content:  z.string(),
  language: z.enum(SUPPORTED_LANGUAGES),
  folderId: z.string().cuid().optional(),
  tagIds:   z.array(z.string().cuid()).optional(),
})
 
const updateSchema = createSchema.partial()
 
const collaboratorSchema = z.object({
  email: z.string().email(),
  role:  z.enum(['Editor', 'Viewer']),
})
 
// ── GET /api/snippets ──────────────────────────────────────────────────────
snippetsRouter.get('/', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId
    const { q, language, tag, folder } = req.query as Record<string, string | undefined>
 
    const snippets = await prisma.snippet.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { collaborators: { some: { userId } } },
        ],
        ...(language ? { language } : {}),
        ...(folder   ? { folderId: folder } : {}),
        ...(q ? {
          OR: [
            { title:   { contains: q, mode: 'insensitive' } },
            { content: { contains: q, mode: 'insensitive' } },
          ],
        } : {}),
        ...(tag ? {
          tags: { some: { tag: { name: { equals: tag, mode: 'insensitive' } } } },
        } : {}),
      },
      select: snippetSelect,
      orderBy: { updatedAt: 'desc' },
    })
    res.json({ ok: true, data: snippets })
  } catch (err) { next(err) }
})
 
// ── GET /api/snippets/:id ──────────────────────────────────────────────────
snippetsRouter.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const userId    = req.user!.userId
    const snippetId = req.params['id']
    if (!snippetId) { res.status(400).json({ ok: false, error: 'Missing id' }); return }
 
    const snippet = await prisma.snippet.findFirst({
      where: {
        id: snippetId,
        OR: [{ ownerId: userId }, { collaborators: { some: { userId } } }],
      },
      select: snippetSelect,
    })
    if (!snippet) { res.status(404).json({ ok: false, error: 'Not found' }); return }
    res.json({ ok: true, data: snippet })
  } catch (err) { next(err) }
})
 
// ── POST /api/snippets ─────────────────────────────────────────────────────
snippetsRouter.post('/', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId
    const { title, content, language, folderId, tagIds } = createSchema.parse(req.body)
 
    const snippet = await prisma.snippet.create({
      data: {
        title,
        content,
        language,
        ownerId: userId,
        ...(folderId ? { folderId } : {}),
        ...(tagIds?.length ? {
          tags: { create: tagIds.map((tagId) => ({ tagId })) },
        } : {}),
      },
      select: snippetSelect,
    })
    res.status(201).json({ ok: true, data: snippet })
  } catch (err) { next(err) }
})
 
// ── PATCH /api/snippets/:id ────────────────────────────────────────────────
snippetsRouter.patch('/:id', async (req: AuthRequest, res, next) => {
  try {
    const userId    = req.user!.userId
    const snippetId = req.params['id']
    if (!snippetId) { res.status(400).json({ ok: false, error: 'Missing id' }); return }
 
    const existing = await prisma.snippet.findFirst({
      where: {
        id: snippetId,
        OR: [
          { ownerId: userId },
          { collaborators: { some: { userId, role: 'Editor' } } },
        ],
      },
    })
    if (!existing) { res.status(403).json({ ok: false, error: 'Forbidden' }); return }
 
    const { tagIds, folderId, ...rest } = updateSchema.parse(req.body)
 
    const snippet = await prisma.snippet.update({
      where: { id: snippetId },
      data: {
        ...rest,
        // folderId can be explicitly set to null to remove from folder
        ...(folderId !== undefined ? { folderId: folderId ?? null } : {}),
        ...(tagIds !== undefined ? {
          tags: {
            deleteMany: {},
            create: tagIds.map((tagId) => ({ tagId })),
          },
        } : {}),
      },
      select: snippetSelect,
    })
    res.json({ ok: true, data: snippet })
  } catch (err) { next(err) }
})
 
// ── DELETE /api/snippets/:id ───────────────────────────────────────────────
snippetsRouter.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const userId    = req.user!.userId
    const snippetId = req.params['id']
    if (!snippetId) { res.status(400).json({ ok: false, error: 'Missing id' }); return }
 
    const existing = await prisma.snippet.findFirst({
      where: { id: snippetId, ownerId: userId },
    })
    if (!existing) { res.status(403).json({ ok: false, error: 'Forbidden' }); return }
 
    await prisma.snippet.delete({ where: { id: snippetId } })
    res.json({ ok: true, data: null })
  } catch (err) { next(err) }
})
 
// ── POST /api/snippets/:id/collaborators ───────────────────────────────────
snippetsRouter.post('/:id/collaborators', async (req: AuthRequest, res, next) => {
  try {
    const userId    = req.user!.userId
    const snippetId = req.params['id']
    if (!snippetId) { res.status(400).json({ ok: false, error: 'Missing id' }); return }
 
    const snippet = await prisma.snippet.findFirst({
      where: { id: snippetId, ownerId: userId },
    })
    if (!snippet) { res.status(403).json({ ok: false, error: 'Only the owner can invite' }); return }
 
    const { email, role } = collaboratorSchema.parse(req.body)
    const invitee = await prisma.user.findUnique({ where: { email } })
    if (!invitee)           { res.status(404).json({ ok: false, error: 'User not found' }); return }
    if (invitee.id === userId) { res.status(400).json({ ok: false, error: 'Cannot invite yourself' }); return }
 
    const collab = await prisma.collaborator.upsert({
      where:  { snippetId_userId: { snippetId, userId: invitee.id } },
      create: { snippetId, userId: invitee.id, role },
      update: { role },
    })
    res.status(201).json({ ok: true, data: collab })
  } catch (err) { next(err) }
})
 
// ── DELETE /api/snippets/:id/collaborators/:collabUserId ───────────────────
snippetsRouter.delete('/:id/collaborators/:collabUserId', async (req: AuthRequest, res, next) => {
  try {
    const requesterId  = req.user!.userId
    const snippetId    = req.params['id']
    const collabUserId = req.params['collabUserId']
    if (!snippetId || !collabUserId) {
      res.status(400).json({ ok: false, error: 'Missing parameters' }); return
    }
 
    const snippet = await prisma.snippet.findFirst({
      where: { id: snippetId, ownerId: requesterId },
    })
    if (!snippet) { res.status(403).json({ ok: false, error: 'Only the owner can remove collaborators' }); return }
 
    await prisma.collaborator.delete({
      where: { snippetId_userId: { snippetId, userId: collabUserId } },
    })
    res.json({ ok: true, data: null })
  } catch (err) { next(err) }
})
 
