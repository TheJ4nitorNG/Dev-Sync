export interface User {
  id: string
  email: string
  avatarUrl: string | null
  createdAt: Date
}

/** Safe subset — never include passwordHash on the wire */
export type PublicUser = Omit<User, 'createdAt'>

export interface UserSession {
  userId: string
  email: string
  iat: number
  exp: number
}
