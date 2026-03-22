import { create } from 'zustand'
import type { Snippet, SnippetSummary, CreateSnippetInput, Language } from '@dev-sync/types'
import { api } from '@/lib/api'

interface FetchParams {
  q?: string
  language?: Language
  tag?: string
  folder?: string
}

interface SnippetState {
  snippets: SnippetSummary[]
  activeSnippet: Snippet | null
  loading: boolean
  fetchSnippets: (params?: FetchParams) => Promise<void>
  fetchSnippet: (id: string) => Promise<void>
  createSnippet: (data: CreateSnippetInput) => Promise<Snippet>
  deleteSnippet: (id: string) => Promise<void>
}

export const useSnippetStore = create<SnippetState>((set) => ({
  snippets: [],
  activeSnippet: null,
  loading: false,

  fetchSnippets: async (params) => {
    set({ loading: true })
    try {
      const res = await api.snippets.list(params)
      // Flatten nested tag join table from Prisma: tags[].tag → tags[]
      const items = (res.data as any[]).map((s: any) => ({
        ...s,
        tags: s.tags?.map((t: any) => t.tag ?? t) ?? [],
      }))
      set({ snippets: items as SnippetSummary[], loading: false })
    } catch {
      set({ loading: false })
    }
  },

  fetchSnippet: async (id) => {
    set({ loading: true })
    try {
      const res = await api.snippets.get(id)
      const s = res.data as any
      const snippet: Snippet = {
        ...s,
        tags: s.tags?.map((t: any) => t.tag ?? t) ?? [],
      }
      set({ activeSnippet: snippet, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  createSnippet: async (payload) => {
    const res = await api.snippets.create(payload)
    const snippet = res.data as Snippet
    set((s) => ({ snippets: [snippet, ...s.snippets] }))
    return snippet
  },

  deleteSnippet: async (id) => {
    await api.snippets.remove(id)
    set((s) => ({
      snippets: s.snippets.filter((sn) => sn.id !== id),
      activeSnippet: s.activeSnippet?.id === id ? null : s.activeSnippet,
    }))
  },
}))
