# Development Guide

## Templates folder structure

The templates are structured on the folder `src/templates` as follows:

```text
src/templates/
├── agents/
│   └── copilot-agent.md
├── instructions/
│   ├── copilot-instructions.md
│   ├── copilot-context-instructions.md
│   ├── chatgpt-instructions.md
│   └── gemini-instructions.md
├── prompts/
│   └── copilot-prompt.md
└── skills/
  └── copilot-skill.md
```

## Current Step Flow Architecture

The home page uses a step wizard.

The state flow is controlled by a client orchestrator component:

- `src/app/components/steps-wizard.tsx`
- Current flow implemented in UI: **2 steps** (`1 | 2`)

### Components and responsibilities

- `src/app/components/file-type-step.tsx`
  - Phase 1 UI only.
  - Handles file type select.
  - Uses `useTranslations("Step1")` for labels and copy.
  - Receives state and callbacks from `StepsWizard`.

- `src/app/components/ai-type-step.tsx`
  - Phase 2 UI only.
  - Handles AI tool select.
  - Renders selected AI tool description and official site link.
  - Uses `useTranslations("Step2")` for labels and copy.
  - Navigation buttons are rendered by `NavbarWizard`.
  - Receives state and callbacks from `StepsWizard`.

- `src/app/components/steps-wizard.tsx`
  - Single client orchestration point.
  - Controls active phase (`1 | 2`).
  - Holds selected file type and selected AI tool state.
  - Builds AI tool options from `src/data/ai-tools.json`.
  - Resolves AI tool descriptions through `useTranslations("aiApps")` when value matches a placeholder pattern (`{...}`).
  - Persists selections to localStorage.
  - Back action clears localStorage and resets to defaults.

- `src/app/components/navbar-wizard.tsx`
  - Navigation component for wizard actions.
  - Step 1: renders Start button (`onForward`).
  - Step 2: renders Back button (`onBack`) and Continue button.
  - Uses `selectedType` to pick step emoji.

- `src/app/components/summary-wizard.tsx`
  - Summary section shown in phase 2 before AI tool selector.
  - Displays selected file type (`currentStep > 1`).
  - Displays selected tool only when `currentStep > 2` (currently not reached in 2-step flow).

## Shared Types and Storage Contract

- `src/types/wizard/templateFiles.ts`
  - Defines wizard file template domain types (`FileType`, `FileTypeOption`).

- `src/types/wizard/aiTools.ts`
  - Defines AI tool domain types (`AiToolData`, `AiToolOption`).

- `src/features/wizard/infra/wizard.storage.service.ts`
  - Implements localStorage persistence as an infrastructure service.
  - Storage key: `ai-agent-crafter-data`
  - Stored shape:
    - `fileType: FileType`
    - `toolId: string`
  - Validates `fileType` against union and `toolId` against available tools list.
  - Public API:
    - `readStoredSelections(...)`
    - `persistSelections(...)`
    - `clearSelections()`

- `src/features/wizard/infra/wizard.storage.types.ts`
  - Defines the storage service contract (`WizardStorageService`) and return model (`StoredSelections`).

- `src/app/components/navbar-wizard.types.ts`
  - Defines `NavbarWizardStepProps`:
    - `currentStep: number`
    - `selectedType: FileType`
    - Optional `onForward` / `onBack`

- `src/app/components/summary.types.ts`
  - Defines `SummarySectionProps` for the summary box contract.

## Data Source for AI Tools

- `src/data/ai-tools.json` is the source of truth for available AI tools, file types and descriptions
- Wizard dropdowns values, and contents are generated from each tool specific nodes.
- Each item also includes:
  - `description` (locale key placeholder or plain text)
  - `url` (official site)

## i18n Rules Applied in This Flow

- Server route file: `src/app/[locale]/page.tsx`
  - Resolves localized strings using `useTranslations("HomePage")`.
  - Builds localized file type options and passes them to `StepsWizard`.

- Client components use translations directly:
  - `steps-wizard`: `useTranslations("aiApps")`
  - `file-type-step`: `useTranslations("Step1")`
  - `ai-type-step`: `useTranslations("Step2")`
  - `navbar-wizard`: `useTranslations("NavbarWizard")`
  - `summary`: `useTranslations("HomePage")`

## Home Route Composition

- `src/app/[locale]/page.tsx`
  - Builds translated file type options from `src/utils/constants.ts`.
  - Calls `clearSelections()` during render (safe no-op on server due to window guard).
  - Renders `StepsWizard` with translated file options.
  - Includes skip link and centered responsive layout.

## Implementation Notes for Next Steps

- Keep phase components focused on UI only.
- Keep orchestration/state transitions inside `steps-wizard.tsx`.
- Keep browser persistence concerns inside `wizard.storage.service.ts`.
- If a new phase is added, follow the same pattern:
  - `new-phase-step.tsx` for UI
  - wizard update for transitions and state wiring
  - type updates in domain files under `src/types/wizard` and related `*.types.ts` files when needed
