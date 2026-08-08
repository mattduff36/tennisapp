# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js App Router + TypeScript + native CSS, deployed on Vercel from GitHub (`mattduff36/tennisapp`).

## Users

Club helpers and coaches on a Microsoft Surface tablet beside the courts. They need to move players between Waiting and three active courts with large, reliable tap targets during live sessions.

## Product Purpose

A touch-friendly tennis pegboard that keeps a live Waiting list and three On Court groups visible at a glance. Success means the board stays correct after refresh and is fast enough to use mid-session without accounts or a backend.

## Positioning

The board itself is a working grass tennis court: white court geometry organizes Waiting and the three courts, and tennis-ball cues communicate selection and movement. That is the mechanism and the identity.

## Operating Context

Used outdoors or indoors on a local Surface in Edge/Chromium. One tablet, one browser profile. State is local to that origin. Future sync is out of scope for version one.

## Capabilities and Constraints

- Create, rename, and delete players (delete confirmed).
- Waiting list and exactly three courts (capacity 0–4; one occupant marked incomplete).
- Tap waiting player, then tap a court to assign; tap on-court player to return to Waiting.
- Persist board state in versioned localStorage only.
- No accounts, backend, PWA, multi-tab sync, or remote conflict handling.

## Brand Commitments

Grass-court green ground, structural white tennis lines, authored tennis-ball/court graphics, purposeful tennis motion. Avoid generic dashboard cards, emoji clip-art, glassmorphism, and “AI slush” aesthetics.

## Evidence on Hand

No club logos or photography yet. Graphics are authored inline SVG/CSS for version one.

## Product Principles

1. Task clarity beats decoration: every control must remain scannable at arm’s length.
2. The court layout is the UI, not wallpaper behind cards.
3. Invalid moves leave state unchanged and give clear feedback.
4. Persistence must be safe: never overwrite storage before hydration or when data is corrupt/newer.
5. Motion communicates placement; it never blocks the next tap.

## Accessibility & Inclusion

Large touch targets (≥48px), visible focus, keyboard activation for all actions, and `prefers-reduced-motion` disables nonessential movement. Strong contrast between white lines, player labels, and grass.
