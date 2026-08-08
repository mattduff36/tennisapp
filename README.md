# Tennis Court Board

Touch-friendly tennis pegboard for a Surface tablet. Manage a Waiting list and three On Court groups (2–4 players preferred; one player marked incomplete). State is saved in browser `localStorage` only.

## Stack

- Next.js App Router + TypeScript
- Native CSS (grass-court visual system)
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
```

## Local development

```bash
npm install
npm run dev
```

Open the local URL in Edge/Chromium. Prefer a tablet-sized viewport for layout checks.

## How to use

1. Add players by name.
2. Tap a Waiting player to select them.
3. Tap **Place here** on a court (max 4).
4. Tap an on-court player to return them to Waiting.
5. Rename/delete from Waiting actions (delete asks for confirmation).
6. **Reset board** clears only this app’s local storage key after confirmation.

## Persistence and origin isolation

- Storage key: `tennisapp.pegboard.v1`
- Schema is versioned. Corrupt or newer data is not overwritten automatically; use **Reset local board**.
- Browser storage is origin-specific. Preview deployments, alternate domains, and production do **not** share state.
- Clearing site data or changing browser profiles removes the board.

### Canonical Surface URL

Bookmark this production URL on the Surface tablet:

**https://tennisapp-delta.vercel.app**

Do not use preview URLs (`*-git-*` or deployment-hash URLs) for the live board. Preview and production origins do not share `localStorage`.

## Future sync boundary

UI and domain logic talk to an async `BoardRepository` (`load` / `save` / `reset`). A remote repository can replace the localStorage implementation later; authentication and conflict semantics are intentionally out of scope for v1.

## Deploy

Connected to GitHub [`mattduff36/tennisapp`](https://github.com/mattduff36/tennisapp) and Vercel project `tennisapp` (team `mpdees-projects`). Production deploys from `main`.

- Production: https://tennisapp-delta.vercel.app
- Also aliased as: https://tennisapp-mpdees-projects.vercel.app
