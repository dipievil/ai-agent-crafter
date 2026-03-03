# AI Agent Crafter

AI Agent Crafter is a Next.js application that guides users through a simple wizard to select:

- the type of AI file to create (agent instructions, specific instructions, prompts, or skills), and
- the AI tool target (for example GitHub Copilot, Gemini, ChatGPT, Codex, and others).

The current implementation focuses on the guided selection flow, localized UI, and persisted user choices.

## Current Status

The app currently provides a **2-step wizard**:

1. Select file type.
2. Select AI tool.

Current behavior:

- File type options are built from constants and localized labels.
- AI tool options are loaded from `src/data/ai-tools.json`.
- Tool descriptions support i18n placeholder resolution.
- Selections are persisted in `localStorage`.
- The back action resets the flow and clears persisted data.

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript (strict mode)
- Tailwind CSS v4
- next-intl (localization)
- Bun (package manager)

## Local Development

Install dependencies:

```bash
bun install
```

Run development server:

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

Build for production:

```bash
bun run build
```

Start production server:

```bash
bun run start
```

Run lint:

```bash
bun run lint
```

## Internationalization

- Supported locales: `pt` (default) and `en`.
- Locale routing and middleware are configured with `next-intl`.
- Message files:
	- `messages/pt.json`
	- `messages/en.json`

## Project Structure

- `src/app/[locale]/page.tsx`: localized home page composition.
- `src/app/components/steps-wizard.tsx`: client-side wizard orchestrator.
- `src/app/components/wizard/file-type-step.tsx`: step 1 UI.
- `src/app/components/wizard/ai-type-step.tsx`: step 2 UI.
- `src/app/components/navbar-wizard.tsx`: wizard navigation buttons.
- `src/app/components/summary-wizard.tsx`: summary section between steps.
- `src/features/wizard/infra/wizard.storage.service.ts`: localStorage persistence service.
- `src/features/wizard/infra/wizard.storage.types.ts`: persistence service interface and types.
- `src/data/ai-tools.json`: AI tools and file metadata source.
- `src/templates/`: markdown templates by category.

## Documentation

For architecture and implementation details, see [docs/development.md](docs/development.md).
