# Component conventions

These conventions keep shared UI consistent and make imports predictable.

## Where things go

- `src/components/ui/` — shadcn/ui primitives (keep existing naming and structure).
- `src/design-system/` — design tokens, patterns, and higher-level design primitives.
- `src/components/` — app-wide shared components that are not route-specific.
- `src/app/**/_components/` — route/feature-local components (prefer colocating here when not reused).

## File naming

- Prefer **PascalCase** for shared React component files in `src/components/` (e.g. `ThemeToggle.tsx`).
- Keep shadcn/ui filenames as-is under `src/components/ui/`.
- Feature folders under `src/components/` are lowercase (e.g. `courses/`) and contain PascalCase components.

## Imports

- Prefer importing from the canonical PascalCase file:
  - Good: `import { ThemeToggle } from '@/components/ThemeToggle'`
- Legacy kebab-case paths are kept as thin re-exports for compatibility during transition.

## Defaults

- Prefer named exports for components.
- Use a default export only when the existing codebase already expects it.
