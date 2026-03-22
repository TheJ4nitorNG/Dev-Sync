import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import type { AuthRequest } from '../middleware/authenticate.js'

export const foldersRouter = Router()

foldersRouter.get('/', async (req: AuthRequest, res, next) => {
  try {
    const folders = await prisma.folder.findMany({
      where: { userId: req.user!.userId },
      orderBy: { name: 'asc' },
    })
    res.json({ ok: true, data: folders })
  } catch (err) { next(err) }
})

foldersRouter.post('/', async (req: AuthRequest, res, next) => {
  try {
    const { name } = z.object({ name: z.string().min(1).max(60) }).parse(req.body)
    const folder = await prisma.folder.create({
      data: { name, userId: req.user!.userId },
    })
    res.status(201).json({ ok: true, data: folder })
  } catch (err) { next(err) }
})

foldersRouter.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    await prisma.folder.deleteMany({
      where: { id: req.params['id'], userId: req.user!.userId },
    })
    res.json({ ok: true, data: null })
  } catch (err) { next(err) }
})
