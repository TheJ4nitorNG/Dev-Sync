import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import type { UserSession } from '../lib/types.js'

export interface AuthRequest extends Request {
  user?: UserSession
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ ok: false, error: 'Missing token' })
    return
  }
  try {
    const token = header.slice(7)
    const secret = process.env['JWT_SECRET'] ?? 'dev-secret-change-me'
    req.user = jwt.verify(token, secret) as UserSession
    next()
  } catch {
    res.status(401).json({ ok: false, error: 'Invalid token' })
  }
}
