import type { AiToolOption } from "@/types/wizard/aiTools";
import type { FileType } from "@/types/wizard/templateFiles";

import type {
  StoredSelections,
  WizardStorageService
} from "./wizard.storage.types";

const STORAGE_KEY = "ai-agent-crafter-data";

function isFileType(value: unknown): value is FileType {
  return (
    value === "agent-instructions" ||
    value === "specific-instructions" ||
    value === "prompts" ||
    value === "skills"
  );
}

function isToolId(value: string, aiTools: AiToolOption[]): boolean {
  return aiTools.some((tool) => tool.id === value);
}

class LocalStorageWizardService implements WizardStorageService {
  readStoredSelections(
    defaultFileType: FileType,
    defaultToolId: string,
    aiTools: AiToolOption[]
  ): StoredSelections {
    if (typeof window === "undefined") {
      return { fileType: defaultFileType, toolId: defaultToolId };
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);

      if (!raw) {
        return { fileType: defaultFileType, toolId: defaultToolId };
      }

      const parsed = JSON.parse(raw) as { fileType?: unknown; toolId?: unknown };
      const fileType = isFileType(parsed.fileType) ? parsed.fileType : defaultFileType;
      const toolId =
        typeof parsed.toolId === "string" &&
        parsed.toolId.length > 0 &&
        isToolId(parsed.toolId, aiTools)
          ? parsed.toolId
          : defaultToolId;

      return { fileType, toolId };
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
      return { fileType: defaultFileType, toolId: defaultToolId };
    }
  }

  persistSelections(fileType: FileType, toolId: string): void {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ fileType, toolId }));
    } catch {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ fileType, toolId }));
    }
  }

  clearSelections(): void {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.removeItem(STORAGE_KEY);
  }
}

const wizardStorageService: WizardStorageService = new LocalStorageWizardService();

export function readStoredSelections(
  defaultFileType: FileType,
  defaultToolId: string,
  aiTools: AiToolOption[]
): StoredSelections {
  return wizardStorageService.readStoredSelections(defaultFileType, defaultToolId, aiTools);
}

export function persistSelections(fileType: FileType, toolId: string): void {
  wizardStorageService.persistSelections(fileType, toolId);
}

export function clearSelections(): void {
  wizardStorageService.clearSelections();
}