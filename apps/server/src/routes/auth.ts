import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'

export const authRouter = Router()

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

authRouter.post('/register', async (req, res, next) => {
  try {
    const { email, password } = registerSchema.parse(req.body)
    const passwordHash = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: { email, passwordHash },
      select: { id: true, email: true, avatarUrl: true },
    })
    res.status(201).json({ ok: true, data: user })
  } catch (err) {
    next(err)
  }
})

authRouter.post('/login', async (req, res, next) => {
  try {
    const { email, password } = registerSchema.parse(req.body)
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      res.status(401).json({ ok: false, error: 'Invalid credentials' })
      return
    }
    const secret = process.env['JWT_SECRET'] ?? 'dev-secret-change-me'
    const token = jwt.sign({ userId: user.id, email: user.email }, secret, { expiresIn: '7d' })
    res.json({ ok: true, data: { token, userId: user.id, email: user.email } })
  } catch (err) {
    next(err)
  }
})
