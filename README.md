# Dev-Sync — Collaborative Code Snippet Manager

> A real-time "Pinterest for developers". Save, tag, and live-edit code snippets with your team.

## Stack

| Layer      | Tech                                              |
|------------|---------------------------------------------------|
| Frontend   | React 18 · Vite · Tailwind · Zustand              |
| Editor     | @monaco-editor/react (VS Code engine)             |
| Real-time  | Socket.io · Yjs (CRDT)                            |
| Backend    | Node.js · Express · TypeScript                    |
| Database   | PostgreSQL · Prisma ORM                           |
| Monorepo   | Turborepo · shared `@dev-sync/types` package      |

## Project Structure

```
dev-sync/
├── .github/
│   └── workflows/         # CI + Deploy pipelines
├── apps/
│   ├── web/               # React + Vite + Tailwind
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── editor/    # Monaco editor, themes, collab panel
│   │   │   │   ├── layout/    # Sidebar, AppLayout
│   │   │   │   └── snippets/  # Dashboard, SnippetCard, NewSnippet
│   │   │   ├── hooks/         # useSocketSync (Yjs + Socket.io)
│   │   │   ├── lib/           # Axios API client
│   │   │   ├── pages/         # Route-level pages
│   │   │   └── stores/        # Zustand auth + snippet stores
│   │   ├── Dockerfile
│   │   └── nginx.conf
│   └── server/            # Node.js + Express + Socket.io
│       ├── src/
│       │   ├── lib/           # Prisma client singleton
│       │   ├── middleware/     # JWT auth, error handler
│       │   ├── routes/        # auth, snippets, tags, folders
│       │   └── socket/        # Yjs delta sync, cursor broadcast
│       ├── prisma/
│       │   └── schema.prisma
│       └── Dockerfile
├── packages/
│   └── types/             # Shared TypeScript interfaces (single source of truth)
├── docker-compose.yml
├── turbo.json
└── README.md
```

## Getting Started (Local Dev)

### Prerequisites
- Node.js ≥ 20
- Docker Desktop

### 1. Clone and install
```bash
git clone https://github.com/YOUR_USERNAME/dev-sync.git
cd dev-sync
npm install
```

### 2. Start PostgreSQL
```bash
docker-compose up -d postgres
```

### 3. Configure environment
```bash
cp apps/server/.env.example apps/server/.env
# .env is pre-filled for local dev — no changes needed
```

### 4. Push database schema
```bash
npm run db:generate
npm run db:push
```

### 5. Run everything
```bash
npm run dev
```

| Service        | URL                        |
|----------------|----------------------------|
| Web app        | http://localhost:5173       |
| API server     | http://localhost:4000       |
| Prisma Studio  | `npm run db:studio`         |

---

## Deployment

### Option A — Railway (recommended, free tier)

1. Push this repo to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Add a **PostgreSQL** plugin
4. Create two services: `server` and `web`, pointing at `apps/server` and `apps/web`
5. Set environment variables on the `server` service:
   ```
   DATABASE_URL=<from Railway postgres plugin>
   JWT_SECRET=<run: openssl rand -base64 32>
   CLIENT_URL=https://your-web-service.railway.app
   NODE_ENV=production
   ```

### Option B — Render

1. Push to GitHub
2. Create a **PostgreSQL** database on Render
3. Create a **Web Service** for the server:
   - Root dir: `apps/server`
   - Build: `npm install && npx prisma generate && npm run build`
   - Start: `node dist/index.js`
4. Create a **Static Site** for the web:
   - Root dir: `apps/web`
   - Build: `npm install && npm run build`
   - Publish dir: `dist`

### Option C — Docker (self-host / VPS)

```bash
# Copy and fill in secrets
cp apps/server/.env.example .env
# Edit .env: set JWT_SECRET and CLIENT_URL

# Build and launch everything
docker-compose up -d --build

# Run migrations
docker-compose exec server npx prisma migrate deploy
```

---

## Key Architecture Decisions

### Real-time Sync (Yjs + Socket.io)
- Each snippet gets a Socket.io room keyed by `snippetId`
- Changes flow as Yjs CRDT binary updates (base64 over the wire)
- The server decodes deltas and persists plain-text content to PostgreSQL
- Late joiners always get the current DB content; Yjs handles conflict resolution

### Type Safety
- `packages/types` is the single source of truth — no type drift between frontend and backend
- Socket.io is fully typed via `ClientToServerEvents` / `ServerToClientEvents`

### Auth
- JWT in `localStorage` via Zustand `persist`
- Auto-logout on any 401 response (Axios interceptor)
- Invite flow: owner sends email → server looks up user → creates `Collaborator` row

---

## Roadmap

- [ ] Yjs persistence provider (y-leveldb) for full history
- [ ] JWT refresh tokens
- [ ] Playwright E2E test suite
- [ ] Language auto-detection from file extension
- [ ] Folder drag-and-drop on dashboard
- [ ] Snippet version history / diff view
- [ ] Public snippet sharing (read-only link)
