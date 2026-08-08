# Design

<!-- impeccable:design-schema 1 -->

## World

Working grass tennis court. The pegboard *is* the court: saturated green playing surface, structural white lines, tennis-ball markers, scoreboard labels. Operate mode — task clarity first, brand in the materials.

## Palette

| Token | Role |
| --- | --- |
| `--grass` / `--grass-deep` / `--grass-light` | Field |
| `--line` | Court lines and primary text |
| `--ball` | Selection / primary action |
| `--accent` | Scoreboard labels |
| `--warning` | Incomplete court |
| `--danger` | Destructive actions |
| `--panel` / `--panel-strong` | Translucent court plates |

## Typography

- Display: Archivo Black (scoreboard / titles)
- UI: IBM Plex Sans

## Components

- Waiting zone and three court zones as lined court plates
- Player tiles with inline tennis-ball SVG
- Court markings + net strip as authored SVG
- Large pill buttons (≥48px), visible focus ring `--focus`

## Motion

- Selected tile pulse
- Successful court placement settle bounce
- Disabled under `prefers-reduced-motion`

## Anti-patterns rejected

Generic dashboard cards, glassmorphism, emoji clip-art, purple/cream AI-default palettes, hover-only affordances.
