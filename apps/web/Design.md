# Design System – Trellis Web

## Run
- Requirements: Node 20+, pnpm 10+
- Install: `pnpm i`
- Dev: `pnpm -C apps/web dev` → http://localhost:3000
- Dark mode: toggle `html.dark` in DevTools to preview

## What to edit first (no TypeScript needed)
- Design tokens: `apps/web/src/app/globals.css`
  - Light: `:root { --background, --foreground, --primary, ... }`
  - Dark: `.dark { --background, --foreground, --primary, ... }`
  - Brand: `--brand-yellow`, `--brand-orange`, `--brand-blue`
  - Radius scale: `--radius` (affects radii across components)
- Tailwind mapping: `apps/web/tailwind.config.ts`
  - Maps Tailwind `colors`, `fontFamily`, `borderRadius` to the CSS variables above
- Fonts: `apps/web/src/app/layout.tsx`
  - Inter + IBM Plex Mono via `next/font`

## Components
- Shadcn UI: `apps/web/src/components/ui/*` (e.g., `ui/button.tsx`)
  - Update styles via Tailwind classes and `cva` variants
  - Add components: `npx shadcn@latest add <component>`
- Feature UIs: `apps/web/src/components/*`
- Prefer token changes over local component overrides

## Guidelines
- Accessibility: AA+ contrast, visible focus states
- Mobile-first: test at 320, 375, 768, 1024, 1440
- Keep class lists consistent across variants; use Tailwind utilities
- Use tokens for colors/spacing/radii to ensure global consistency

## Deliverables (for PR)
- Token updates in `globals.css` (+ dark mode if applicable)
- Any component style/variant edits (e.g., `src/components/ui/*`)
- Before/after screenshots (light + dark)
- Notes on spacing, radii, typography, and interaction states