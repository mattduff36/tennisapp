# Design

<!-- impeccable:design-schema 1 -->

## World

Working grass tennis court. The tablet board *is* the court: saturated green playing surface, structural white lines, tennis-ball markers, scoreboard labels. The phone pool uses the same materials with a quiet top nav, a scrolling ticker, and a pinned action dock. The same Board / Play / Settings nav sits on the tablet board.

## Palette

| Token | Role |
| --- | --- |
| `--grass` / `--grass-deep` / `--grass-light` | Field |
| `--line` | Court lines and primary text |
| `--ball` | Selection / primary action |
| `--accent` | Scoreboard labels |
| `--warning` | Session notices |
| `--danger` | Destructive actions |
| `--panel` / `--panel-strong` | Translucent court plates |

## Typography

- Display: Archivo Black (scoreboard / titles)
- UI: IBM Plex Sans

## Components

- Waiting zone and named court plates (tablet, 1–8 courts)
- Player tiles with inline tennis-ball SVG
- Large pill buttons (≥48px tablet; `.play-primary` ~88px on phone)
- Quiet Board / Play / Settings top nav on every surface
- Phone action dock for Players ready / Leave / I'm done
- Scrolling session ticker
- Visible focus ring `--focus`

## Phone play shell

- `.play-shell` is the viewport (`100dvh`): top nav, scrolling main, ticker, dock
- `html` / `body` stay `overflow: hidden` for the tablet board
- Name, waiting, and assignment screens keep primary actions in the dock except Join
- From `900px`, Play uses two columns (pool or assignment | court summary) and Settings uses two, then three from `1200px` (Display+Game | Courts | Players)

## Tablet / desktop board

- From `900px` the board is a scoreboard, not a stretched phone: waiting is a sidebar (`15.5–20rem`), courts take the remaining width
- Add-player and the board ready dock stay capped (`22–24rem` / `28rem`); board chrome uses tap-height (`--tap`, 48px), not the phone `5.5rem` controls
- Court plates size to their players; the board stage scrolls if needed, not the individual court
- Status sits as a compact toolbar (session + notice, reset trailing)

## Motion

- Ticker scroll
- Disabled under `prefers-reduced-motion`

## Anti-patterns rejected

Generic dashboard cards, glassmorphism, emoji clip-art, purple/cream AI-default palettes, hover-only affordances.
