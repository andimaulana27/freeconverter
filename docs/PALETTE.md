# Palette

Locked 1 October 2026. Visual: canvas `freeconverter-palette`. Product rules: `docs/DNA.md`.

FreeConverter is white, black, gray, and one red. Red is an action color, never a full-page background.

| Token | Hex | Use |
|---|---|---|
| `paper` | `#FFFFFF` | Page, header, workbench |
| `bone` | `#F7F7F7` | File chips, quiet wells |
| `ink` | `#111111` | Headings, logo, primary text |
| `mute` | `#6B6B6B` | Body, nav links |
| `faint` | `#9A9A9A` | Captions |
| `line` | `#E8E8E8` | Rules, borders |
| `accent` | `#D92D28` | Convert, active format, drag, progress |
| `accent-ink` | `#B91C1C` | Hover / press |
| `accent-soft` | `#FDECEC` | Drop active fill, selection |
| `accent-light` | `#FF6A64` | Brand detail on dark surfaces |

## Rules

- Page background is white, not cream.
- Red appears on Convert, the output format, drag corners, and the progress bar.
- Do not paint the hero or dropzone red (fashion full-bleed).
- Nav is Linear/Stripe: text links, no pills, one red Convert on the right.
- Donate uses the neutral support style and remains visually secondary to Convert.
- Tool page is an editorial workbench: giant mono `FROM → TO`, then the stage. Not a centered dashed card like Smallpdf/iLovePDF.

## Button scheme

`src/components/ui/Button.tsx` is the single source of truth. Do not recreate these states with page-local class strings.

- Six variants: `primary` (principal product action), `secondary` (standard outline), `ink` (strong neutral), `ghost` (low emphasis), `danger` (destructive), and `support` (donation/community).
- Five sizes: `xs`, `sm`, `md`, `lg`, and `icon`.
- Use `Button` for native actions, `ButtonLink` for internal navigation, and `ButtonAnchor` for external destinations.
- Keep `primary` red for genuine principal actions. Donate uses `support`, never `primary`.

## Motion

- Drop: corner marks grow, stage fills `accent-soft`, left rule draws in.
- Files: chip slides in from the left (220ms).
- Arrow between formats: idle nudge. Stops if `prefers-reduced-motion`.
- Route: red dot travels source card → output card (`animate-route`).
- Convert busy: red sweep on the top edge of the stage.
- Done: one enter fade, no confetti.
