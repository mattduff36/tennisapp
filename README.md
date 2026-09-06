# Tennis Court Board

Touch-friendly tennis club app with two surfaces:

- **Tablet pegboard** at `/` — Waiting list and three On Court groups. State is saved in browser `localStorage` only.
- **Phone PWA** at `/play` — Players join a shared Neon waiting pool, start one court at a time, and see who they are playing with.

## Stack

- Next.js App Router + TypeScript
- Native CSS (grass-court visual system)
- Neon Postgres (`DATABASE_URL`)
- Vitest + Testing Library
- Playwright

## Scripts

```bash
npm run dev
npm run lint
npm run typecheck
npm test
npm run build
npm run start
npm run test:e2e
npm run db:migrate
```

## Local development

```bash
npm install
# add DATABASE_URL in .env.local (Neon)
npm run db:migrate
npm run dev
```

- Tablet board: `http://localhost:3000/`
- Player app: `http://localhost:3000/play`
- Settings: `http://localhost:3000/settings`

Prefer a phone-sized viewport for `/play`. Add the PWA from `/play` (`start_url` is the player app).

## How to use the tablet board

1. Add players by name.
2. Tap a Waiting player to select them.
3. Tap **Place here** on a court (max 4).
4. Tap an on-court player to return them to Waiting.
5. Rename/delete from Waiting actions (delete asks for confirmation).
6. **Reset board** clears only this app’s local storage key after confirmation.

## How to use the player app

1. Enter your name. If that name is already in the pool, pick another.
2. Wait in the pool. When enough players are waiting and a court is free, tap **Players ready**.
3. You plus random waiters are assigned to the first free court.
4. Open the app again (or stay on the lobby — it polls) to see the court and partners.
5. **I'm done** returns everyone on that court to waiting.
6. **Settings** can change court count, singles/doubles, names, and reset the session.

This phone remembers you in `localStorage` (`tennisapp.me.v1`). There is no login.

## Persistence and origin isolation

- Tablet storage key: `tennisapp.pegboard.v1`
- Phone identity key: `tennisapp.me.v1`
- Shared pool: Neon tables `app_settings`, `courts`, `players`
- Tablet schema is versioned. Corrupt or newer data is not overwritten automatically; use **Reset local board**.
- Browser storage is origin-specific. Preview deployments, alternate domains, and production do **not** share `localStorage`.
- Clearing site data removes the remembered name and the tablet board.

### Canonical Surface URL

Bookmark this production URL on the Surface tablet:

**https://tennisapp-delta.vercel.app**

Use **https://tennisapp-delta.vercel.app/play** on phones.

Do not use preview URLs (`*-git-*` or deployment-hash URLs) for the live board. Preview and production origins do not share `localStorage`, and preview databases may differ.

## Deploy

Connected to GitHub [`mattduff36/tennisapp`](https://github.com/mattduff36/tennisapp) and Vercel project `tennisapp` (team `mpdees-projects`). Production deploys from `main`. Set `DATABASE_URL` on Vercel. Run `npm run db:migrate` once against that database (the first session API request also applies the schema).

- Production: https://tennisapp-delta.vercel.app
- Also aliased as: https://tennisapp-mpdees-projects.vercel.app
