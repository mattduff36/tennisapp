# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js App Router + TypeScript + native CSS, deployed on Vercel from GitHub (`mattduff36/tennisapp`). Shared session state lives in Neon Postgres.

## Users

Two surfaces, one session:

- Club helpers on a Microsoft Surface tablet using the live board at `/`.
- Players on their phones using the installable PWA at `/play`.

## Product Purpose

A grass-court tennis club tool with a tablet board and a very simple phone app. Players join a shared waiting pool by name. When enough people are waiting, anyone can tap **Players ready**; the app fills one free court and shows each selected player their court and partners.

## Positioning

The tablet board is a live view of the shared session: waiting list and named courts. The phone app uses the same grass, lines, and tennis-ball actions, with huge buttons and a quiet Board / Play / Settings nav.

## Operating Context

- Both surfaces read and write the same Neon session. The lobby polls every 3 seconds.
- Phone identity is remembered in `localStorage` (`tennisapp.me.v1`). No accounts. Duplicate names are rejected.
- Text size is a local display preference on this device.

## Capabilities and Constraints

Tablet (`/`):

- Add walk-up names to the pool (no phone identity is stored).
- See waiting players and occupied courts, including match duration.
- Tap **Players ready** to fill the next free court with the longest-waiting players.
- Rename/remove players, clear a court, reset the session, open Settings.

Phone (`/play`, `/settings`):

- Ask “What is your name?” and join the pool.
- Remember this phone’s player; a taken name must be changed.
- Show the waiting list; **Players ready** fills one free court (you plus random waiters).
- Assignment screen: court name, partners, **I'm done** (whole court returns to waiting).
- Settings: court count, singles/doubles, court names, rename/remove players, clear court, reset session, text size.

No push notifications and no settings PIN.

## Brand Commitments

Grass-court green ground, structural white tennis lines, authored tennis-ball/court graphics, purposeful tennis motion. Avoid generic dashboard cards, emoji clip-art, glassmorphism, and “AI slush” aesthetics.

## Evidence on Hand

No club logos or photography yet. Graphics are authored inline SVG/CSS.

## Product Principles

1. Task clarity beats decoration: every control must remain scannable at arm’s length.
2. The court layout is the UI on the tablet; the phone app is three obvious screens.
3. Invalid moves leave state unchanged and give clear feedback.
4. Shared session writes use a locked transaction.
5. Motion communicates placement; it never blocks the next tap.

## Accessibility & Inclusion

Large touch targets (tablet ≥48px, phone primary actions ~64–88px), visible focus, keyboard activation for all actions, and `prefers-reduced-motion` disables nonessential movement. Strong contrast between white lines, player labels, and grass.
