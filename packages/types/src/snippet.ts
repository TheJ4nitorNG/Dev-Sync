export const SUPPORTED_LANGUAGES = [
  'typescript',
  'javascript',
  'python',
  'go',
  'rust',
  'sql',
  'bash',
  'json',
  'yaml',
  'markdown',
  'plaintext',
] as const

export type Language = (typeof SUPPORTED_LANGUAGES)[number]

export type CollaboratorRole = 'Editor' | 'Viewer'

export interface Tag {
  id: string
  name: string
  color: string
}

export interface Collaborator {
  userId: string
  snippetId: string
  role: CollaboratorRole
  user: Pick<import('./user').User, 'id' | 'email' | 'avatarUrl'>
}

export interface Folder {
  id: string
  name: string
  userId: string
}

export interface Snippet {
  id: string
  title: string
  content: string
  language: Language
  ownerId: string
  folderId: string | null
  createdAt: Date
  updatedAt: Date
  tags: Tag[]
  collaborators: Collaborator[]
  owner: Pick<import('./user').User, 'id' | 'email' | 'avatarUrl'>
}

export type SnippetSummary = Pick<
  Snippet,
  'id' | 'title' | 'language' | 'ownerId' | 'createdAt' | 'updatedAt' | 'tags'
>

export interface CreateSnippetInput {
  title: string
  content: string
  language: Language
  folderId?: string
  tagIds?: string[]
}

export interface UpdateSnippetInput {
  title?: string
  content?: string
  language?: Language
  folderId?: string | null
  tagIds?: string[]
}
