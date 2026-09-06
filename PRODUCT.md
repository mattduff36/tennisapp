# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js App Router + TypeScript + native CSS, deployed on Vercel from GitHub (`mattduff36/tennisapp`). Shared player-pool state lives in Neon Postgres.

## Users

Two surfaces:

- Club helpers on a Microsoft Surface tablet using the local pegboard at `/`.
- Players on their phones using the installable PWA at `/play`.

## Product Purpose

A grass-court tennis club tool with a tablet display board and a very simple phone app. Players join a shared waiting pool by name. When enough people are waiting, anyone can tap **Players ready**; the app fills one free court (the requester plus random waiters) and shows each selected player their court and partners.

## Positioning

The tablet board is still a working grass tennis court. The phone app uses the same grass, lines, and tennis-ball actions, with huge buttons and two destinations only: Play and Settings.

## Operating Context

- Tablet pegboard: one browser profile, `localStorage` only, unchanged from the original board.
- Phone PWA: shared Neon session, identity remembered in `localStorage` (`tennisapp.me.v1`). No accounts. Duplicate names are rejected. The lobby polls every 3 seconds.

## Capabilities and Constraints

Tablet (`/`):

- Create, rename, and delete players (delete confirmed).
- Waiting list and exactly three courts (capacity 0–4; one occupant marked incomplete).
- Persist board state in versioned localStorage only.

Phone (`/play`, `/settings`):

- Ask “What is your name?” and join the pool.
- Remember this phone’s player; a taken name must be changed.
- Show the waiting list; **Players ready** fills one free court.
- Assignment screen: court name, partners, **I'm done** (whole court returns to waiting).
- Settings: court count, singles/doubles, court names, rename/remove players, clear court, reset session.
- No push notifications, no settings PIN, no wiring of the tablet board to Neon yet.

## Brand Commitments

Grass-court green ground, structural white tennis lines, authored tennis-ball/court graphics, purposeful tennis motion. Avoid generic dashboard cards, emoji clip-art, glassmorphism, and “AI slush” aesthetics.

## Evidence on Hand

No club logos or photography yet. Graphics are authored inline SVG/CSS.

## Product Principles

1. Task clarity beats decoration: every control must remain scannable at arm’s length.
2. The court layout is the UI on the tablet; the phone app is three obvious screens.
3. Invalid moves leave state unchanged and give clear feedback.
4. Persistence must be safe: never overwrite tablet storage before hydration or when data is corrupt/newer. Shared session writes use a locked transaction.
5. Motion communicates placement; it never blocks the next tap.

## Accessibility & Inclusion

Large touch targets (tablet ≥48px, phone primary actions ~64–88px), visible focus, keyboard activation for all actions, and `prefers-reduced-motion` disables nonessential movement. Strong contrast between white lines, player labels, and grass.
