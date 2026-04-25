# Frontend Playbook

This project uses a small, opinionated Next.js stack so future features can follow the same shape.

## Language

- Use TypeScript by default.
- Route components use `.tsx`; shared helpers and feature data use `.ts`.
- Keep `strict` TypeScript enabled and avoid `any` unless a third-party boundary forces it.
- New shadcn/ui components should be generated as TSX through `components.json` with `"tsx": true`.
- User-facing repository documents and Git commit messages should be written in Chinese.

## Default Skills

- `build-web-apps:react-best-practices` for Next.js architecture, server/client component boundaries, data fetching, and performance.
- `build-web-apps:shadcn` for UI composition, component installation, semantic tokens, and accessibility patterns.
- `build-web-apps:frontend-app-builder` for larger user-facing screens and visual systems.
- `superpowers:systematic-debugging` when behavior is surprising or a build/test fails.
- `superpowers:verification-before-completion` before claiming a change is complete.

Installed optional skills:

- `playwright`
- `vercel-deploy`
- `security-best-practices`
- `security-threat-model`

Restart Codex after skill installation so newly installed skills appear in the active skill list.

## Project Shape

- `app/` contains routes, layouts, and route-level server components.
- `components/ui/` contains shadcn/ui source components managed by the shadcn CLI.
- `components/<domain>/` contains composed UI for a product area.
- `features/<domain>/` contains feature data, helpers, and domain-specific logic.
- `lib/` contains shared utilities such as `cn()`.
- `docs/` contains project conventions and implementation notes.

## UI Rules

- Prefer shadcn/ui components before custom markup.
- Use semantic Tailwind tokens such as `bg-background`, `text-muted-foreground`, `border-border`, and `text-primary`.
- Use `gap-*` for spacing instead of `space-*`.
- Use `size-*` when width and height are equal.
- Use lucide icons in icon buttons or icon+text actions when an icon exists.
- Keep cards for individual repeated items or framed tool panels, not every page section.

## Next.js Rules

- Keep route files thin. Move reusable UI into `components/<domain>/`.
- Keep feature data and helpers out of page components when they will grow.
- Server components are the default. Add `"use client"` only when state, effects, event handlers, or browser APIs are needed.
- Start independent async work early and await late when adding data fetching.
- Avoid barrel imports for heavy component folders.

## Verification

Use the strongest available command before handoff:

```bash
npm run build
```

For visual or interactive changes, also run the app and inspect desktop and mobile views.
