import type { AiToolOption, FileType } from "@/types/wizard/common";

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
    defaultFileName: string,
    aiTools: AiToolOption[]
  ): StoredSelections {
    if (typeof window === "undefined") {
      return { fileType: defaultFileType, toolId: defaultToolId, fileName: defaultFileName };
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);

      if (!raw) {
        return { fileType: defaultFileType, toolId: defaultToolId, fileName: defaultFileName };
      }

      const parsed = JSON.parse(raw) as { fileType?: unknown; toolId?: unknown; fileName?: unknown };
      const fileType = isFileType(parsed.fileType) ? parsed.fileType : defaultFileType;
      const toolId =
        typeof parsed.toolId === "string" &&
        parsed.toolId.length > 0 &&
        isToolId(parsed.toolId, aiTools)
          ? parsed.toolId
          : defaultToolId;
      const fileName = typeof parsed.fileName === "string" ? parsed.fileName : defaultFileName;

      return { fileType, toolId, fileName };
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
      return { fileType: defaultFileType, toolId: defaultToolId, fileName: defaultFileName };
    }
  }

  persistSelections(fileType: FileType, toolId: string, fileName: string): void {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ fileType, toolId, fileName }));
    } catch {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ fileType, toolId, fileName }));
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
  defaultFileName: string,
  aiTools: AiToolOption[]
): StoredSelections {
  return wizardStorageService.readStoredSelections(defaultFileType, defaultToolId, defaultFileName, aiTools);
}

export function persistSelections(fileType: FileType, toolId: string, fileName: string): void {
  wizardStorageService.persistSelections(fileType, toolId, fileName);
}

export function clearSelections(): void {
  wizardStorageService.clearSelections();
}