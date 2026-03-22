import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'

export const tagsRouter = Router()

tagsRouter.get('/', async (_req, res, next) => {
  try {
    const tags = await prisma.tag.findMany({ orderBy: { name: 'asc' } })
    res.json({ ok: true, data: tags })
  } catch (err) { next(err) }
})

tagsRouter.post('/', async (req, res, next) => {
  try {
    const { name, color } = z.object({
      name: z.string().min(1).max(40),
      color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    }).parse(req.body)
    const tag = await prisma.tag.create({ data: { name, color } })
    res.status(201).json({ ok: true, data: tag })
  } catch (err) { next(err) }
})
