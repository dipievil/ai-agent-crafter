# Development Guide

## Templates structure

The app will generate the templates based on the json structure for each ai tool and format the user choose on the `src/data/ai-tools.json` file.

The `template`  node has two main nodes 'header' and 'body'. Some projects has different header formart (Github Copilot) but others are markdown file formats exclusive, so the body is the markdown content file.

Each item on header and body item will have all data required to create form fieds for user inputs and file format to the application know how to write down the markdown file.

Example:

```json
{
  "body": [
    {
      "name": "mainInstructions",
      "sectionName": "Main instructions",
      "sectionType": "mainSection",
      "formInput": "long",
      "formHint": "The main instructions for the project. This section can be used on the instructions template to provide detailed guidance and context for the project.",
      "required": true
    }
  ]
}
```

### Template items

- **name**: Is the main data key used for system interation and key
- **formtHint**: The default hint for that field on the form.
- **formLabel**: Default Label to be showed on the form. App will use _name_ in case of this is not defined.
- **formInput**: Field type that will show to user. See [Valid formInput types](#valid-forminput-types)
- **sectionName**: The section name on the markdown file. The app will use _name_ in case this is not defined
- **type**: This is how is the content is written on the markdown file .See [Valid types](#valid-types)
- **required**: if don't exist or is true it is not mandatory to build the file so it will be mandatory on save

#### Valid formInput types

- **short**: a short text value that will render a single input. This is the default in case of missing one.
- **long"**: a paragraph or more that render a textarea
- **comma-list**: a list of items that render a tag list that can be removed
- **list**: a list of text values that can be dynamic

#### Valid types

- **mainSection**: The content has a title level 1 (single trailing #). This is the default text format in case of missing value.
- **secondSection**: The content has a title level 2 (two trailing #)
- **list**: A list after a title level 2 (two trailing #)
- **listParagraph**: just a markdown list without no title
- **valueKey**: the name and the content split by ":"
- **arrayKey**: the name with a list of the values in JSON array format
- **objectsKey**: the name with user typed values as a list of objects in JSON format

### Translated templates inputs

For the form values translated values can be use the format `templates.{ai Tool}.{file type}.{content area}.{content type}`.

Example:

```json
"templates": {
    "github-copilot": {
      "specific-instructions": {
        "header": {
          "description": {
            "label": "Description",
            "hint": "A short description of the project that will be used on the instructions template."
          },
          "applyto": {
            "label": "Apply to",
            "hint": "A short description of what the instructions apply to."
          }
        }
      }
    }
}
```

## Notes

A content itens with value _name_ or _description_ on item "name" will not generate a form input since it was previously inputed.

## Step Flow Architecture

The home page uses a step wizard.

The state flow is controlled by a client orchestrator component:

- `src/app/components/wizard.tsx`
- Current flow implemented in UI: **2 steps** (`1 | 2`)

### Components and responsibilities

- `src/app/components/wizard.tsx`
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

- `src/app/components/wizard`
  - Folder contains all form component split by steps.

- `src/app/components/wizard/file-type-step.tsx`
  - Phase 1 UI only.
  - Handles file type select.
  - Uses `useTranslations("Step1")` for labels and copy.
  - Receives state and callbacks from `StepsWizard`.

- `src/app/components/wizard/ai-type-step.tsx`
  - Phase 2 UI only.
  - Handles AI tool select.
  - Renders selected AI tool description and official site link.
  - Uses `useTranslations("Step2")` for labels and copy.
  - Navigation buttons are rendered by `NavbarWizard`.
  - Receives state and callbacks from `StepsWizard`.

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
