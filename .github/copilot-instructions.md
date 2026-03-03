# Copilot Instructions

This is a simple Next.js 16 application that helps user to generate AI agents instructions and includes a multi-step wizard interface for selecting file types and AI tools, with state persistence and i18n support. It uses React Server Components, Tailwind CSS, and TypeScript.

# Agent behavior

## Language

- Always answer informal and in Brazilian Portuguese in the style of a friendly colleague, using informal language.
- Documentation must be in English.
- Always check if repository is updated before answer.
ervices.

## Key points
- The summary step, read the selected file type and tool from storage and display a summary of the choices, including the tool description and a link to its official site.

## Development Instructions
 - For new steps, create a new file under `src/app/components/` with the component logic and a corresponding `*.types.ts` file for TypeScript types. 
 - Each step will add a new entry on the SummarySection, so ensure to update the summary component to include the new step's data.
- Ensure all components are properly typed with TypeScript and follow the existing project conventions for styling and structure.
 - Use Tailwind CSS for styling, following the existing design patterns in the project.
 - Avoid DRY violations by reusing existing components and utilities where possible, such as the `NavbarWizard` for navigation and the `SummarySection` for displaying the summary of selections.
- For component common types, define them in a shared types file (e.g., `src/types/wizard/common.ts`) and import them across components to maintain consistency.

 ### Current resources
 - Use the existing `src/data/ai-tools.json` as the source of truth for available AI tools and file types. For any new tool or file type, add it to this JSON file with the required properties (`id`, `name`, `description`, `url`).
 - Use `useTranslations` hook for all user-facing text, with keys defined in `messages/en.json`.
 - Persist user selections in `localStorage` using the API defined in `src/features/wizard/infra/wizard.storage.service.ts`.
  

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
