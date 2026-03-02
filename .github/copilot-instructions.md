# Copilot Instructions

# Agent behavior

## Language

- Always answer informal and in Brazilian Portuguese in the style of a friendly colleague, using informal language.
- Documentation must be in English.
- Always check if repository is updated before answer.
ervices.

## Commands

This project uses **bun** as the package manager. Use `bun add` / `bun remove` for dependency management, not npm/yarn/pnpm.

## Architecture

Next.js 16 App Router project. All routes and layouts live under `app/`:

- `app/layout.tsx` — Root layout: sets up fonts (Geist Sans + Geist Mono via `next/font/google`), global metadata, and applies CSS variables via class attributes on `<body>`
- `app/page.tsx` — Home page (Server Component by default)
- `app/globals.css` — Global styles; Tailwind CSS entry point

New routes are added as folders under `app/` with a `page.tsx` file. Nested layouts use `layout.tsx` at the folder level.

## Key Conventions

**TypeScript:** Strict mode is enabled. The `@/*` path alias maps to the repository root (e.g., `import { foo } from "@/lib/foo"`).

**Tailwind CSS v4:** Uses the new v4 syntax — `@import "tailwindcss"` and `@theme inline { ... }` blocks instead of v3's `@tailwind base/components/utilities` directives. CSS custom properties (e.g., `--font-sans`, `--color-background`) are used to bridge Tailwind theme tokens with runtime values.

**Dark mode:** Handled via `prefers-color-scheme` media query in `globals.css` (CSS-only, not Tailwind's `dark:` class strategy). Dark-mode variants in components use Tailwind's `dark:` prefix.

**Server vs. Client Components:** Components are Server Components by default. Add `"use client"` only when browser APIs or React hooks are needed.

**Images:** Use `next/image` (`<Image>`) for all images to get automatic optimization.
