# Design

<!-- impeccable:design-schema 1 -->

## World

Working grass tennis court. The pegboard *is* the court: saturated green playing surface, structural white lines, tennis-ball markers, scoreboard labels. The phone pool uses the same materials with a scrolling play shell and two huge nav tabs.

## Palette

| Token | Role |
| --- | --- |
| `--grass` / `--grass-deep` / `--grass-light` | Field |
| `--line` | Court lines and primary text |
| `--ball` | Selection / primary action |
| `--accent` | Scoreboard labels |
| `--warning` | Incomplete court / session notices |
| `--danger` | Destructive actions |
| `--panel` / `--panel-strong` | Translucent court plates |

## Typography

- Display: Archivo Black (scoreboard / titles)
- UI: IBM Plex Sans

## Components

- Waiting zone and three court zones as lined court plates (tablet)
- Player tiles with inline tennis-ball SVG
- Court markings + net strip as authored SVG
- Large pill buttons (≥48px tablet; `.play-primary` ~88px on phone)
- Play / Settings footer tabs
- Visible focus ring `--focus`

## Phone play shell

- `.play-shell` is the viewport scrollport (`100dvh`) with safe-area padding
- `html` / `body` stay `overflow: hidden` for the tablet board
- Name, waiting, and assignment screens stack one primary action at a time

## Motion

- Selected tile pulse
- Successful court placement settle bounce
- Disabled under `prefers-reduced-motion`

## Anti-patterns rejected

Generic dashboard cards, glassmorphism, emoji clip-art, purple/cream AI-default palettes, hover-only affordances.
