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
    defaultDescription: string,
    defaultHeaderFormValues: Record<string, string | string[]>,
    aiTools: AiToolOption[]
  ): StoredSelections {
    if (typeof window === "undefined") {
      return {
        fileType: defaultFileType,
        toolId: defaultToolId,
        fileName: defaultFileName,
        description: defaultDescription,
        headerFormValues: defaultHeaderFormValues
      };
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);

      if (!raw) {
        return {
          fileType: defaultFileType,
          toolId: defaultToolId,
          fileName: defaultFileName,
          description: defaultDescription,
          headerFormValues: defaultHeaderFormValues
        };
      }

      const parsed = JSON.parse(raw) as {
        fileType?: unknown;
        toolId?: unknown;
        fileName?: unknown;
        description?: unknown;
        headerFormValues?: unknown;
      };
      const fileType = isFileType(parsed.fileType) ? parsed.fileType : defaultFileType;
      const toolId =
        typeof parsed.toolId === "string" &&
        parsed.toolId.length > 0 &&
        isToolId(parsed.toolId, aiTools)
          ? parsed.toolId
          : defaultToolId;
      const fileName = typeof parsed.fileName === "string" ? parsed.fileName : defaultFileName;
      const description = typeof parsed.description === "string" ? parsed.description : defaultDescription;
      const headerFormValues =
        parsed.headerFormValues &&
        typeof parsed.headerFormValues === "object" &&
        !Array.isArray(parsed.headerFormValues)
          ? this.normalizeHeaderFormValues(parsed.headerFormValues)
          : defaultHeaderFormValues;

      return { fileType, toolId, fileName, description, headerFormValues };
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
      return {
        fileType: defaultFileType,
        toolId: defaultToolId,
        fileName: defaultFileName,
        description: defaultDescription,
        headerFormValues: defaultHeaderFormValues
      };
    }
  }

  persistSelections(
    fileType: FileType,
    toolId: string,
    fileName: string,
    description: string,
    headerFormValues: Record<string, string | string[]>
  ): void {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ fileType, toolId, fileName, description, headerFormValues })
      );
    } catch {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ fileType, toolId, fileName, description, headerFormValues })
      );
    }
  }

  private normalizeHeaderFormValues(value: unknown): Record<string, string | string[]> {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return {};
    }

    const entries = Object.entries(value as Record<string, unknown>).map(([key, entryValue]) => {
      if (typeof entryValue === "string") {
        return [key, entryValue] as const;
      }

      if (Array.isArray(entryValue)) {
        const validArray = entryValue.filter((item): item is string => typeof item === "string");
        return [key, validArray] as const;
      }

      return [key, ""] as const;
    });

    return Object.fromEntries(entries);
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
  defaultDescription: string,
  defaultHeaderFormValues: Record<string, string | string[]>,
  aiTools: AiToolOption[]
): StoredSelections {
  return wizardStorageService.readStoredSelections(
    defaultFileType,
    defaultToolId,
    defaultFileName,
    defaultDescription,
    defaultHeaderFormValues,
    aiTools
  );
}

export function persistSelections(
  fileType: FileType,
  toolId: string,
  fileName: string,
  description: string,
  headerFormValues: Record<string, string | string[]>
): void {
  wizardStorageService.persistSelections(fileType, toolId, fileName, description, headerFormValues);
}

export function clearSelections(): void {
  wizardStorageService.clearSelections();
}