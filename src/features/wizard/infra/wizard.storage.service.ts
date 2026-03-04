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

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

class LocalStorageWizardService implements WizardStorageService {
  readStoredSelections(
    storedFileType: FileType,
    storedToolId: string,
    storedFileSubtypeIndex: number,
    storedDynamicFileNameValue: string,
    storedEntityName: string,
    storedOutputFileName: string,
    storedDescription: string,
    storedHeaderFormValues: Record<string, string | string[]>,
    storedBodyFormValues: Record<string, string | string[]>,
    aiTools: AiToolOption[]
  ): StoredSelections {
    
    if (typeof window === "undefined") {
      return {
        fileType: storedFileType,
        toolId: storedToolId,
        fileSubtypeIndex: storedFileSubtypeIndex,
        dynamicFileNameValue: storedDynamicFileNameValue,
        entityName: storedEntityName,
        outputFileName: storedOutputFileName,
        description: storedDescription,
        headerFormValues: storedHeaderFormValues,
        bodyFormValues: storedBodyFormValues
      };
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);

      if (!raw) {
        return {
          fileType: storedFileType,
          toolId: storedToolId,
          fileSubtypeIndex: storedFileSubtypeIndex,
          dynamicFileNameValue: storedDynamicFileNameValue,
          entityName: storedEntityName,
          outputFileName: storedOutputFileName,
          description: storedDescription,
          headerFormValues: storedHeaderFormValues,
          bodyFormValues: storedBodyFormValues
        };
      }

      const parsed = JSON.parse(raw) as {
        fileType?: unknown;
        toolId?: unknown;
        fileSubtypeIndex?: unknown;
        dynamicFileNameValue?: unknown;
        entityName?: unknown;
        outputFileName?: unknown;
        description?: unknown;
        headerFormValues?: unknown;
        bodyFormValues?: unknown;
      };
    
      const fileType = isFileType(parsed.fileType) ? parsed.fileType : storedFileType;
    
      const toolId =
        typeof parsed.toolId === "string" &&
        parsed.toolId.length > 0 &&
        isToolId(parsed.toolId, aiTools)
          ? parsed.toolId
          : storedToolId;
    
      const entityName = typeof parsed.entityName === "string" ? parsed.entityName : storedEntityName;
      const outputFileName =
        typeof parsed.outputFileName === "string" ? parsed.outputFileName : storedOutputFileName;

      const fileSubtypeIndex = isNonNegativeInteger(parsed.fileSubtypeIndex)
        ? parsed.fileSubtypeIndex
        : storedFileSubtypeIndex;

      const dynamicFileNameValue =
        typeof parsed.dynamicFileNameValue === "string"
          ? parsed.dynamicFileNameValue
          : storedDynamicFileNameValue;

      const description = typeof parsed.description === "string" ? parsed.description : storedDescription;

      const headerFormValues =
        parsed.headerFormValues &&
        typeof parsed.headerFormValues === "object" &&
        !Array.isArray(parsed.headerFormValues)
          ? this.normalizeFormValues(parsed.headerFormValues)
          : storedHeaderFormValues;
      
      const bodyFormValues =
        parsed.bodyFormValues &&
        typeof parsed.bodyFormValues === "object" &&
        !Array.isArray(parsed.bodyFormValues)
          ? this.normalizeFormValues(parsed.bodyFormValues)
          : storedBodyFormValues;

      return {
        fileType,
        toolId,
        fileSubtypeIndex,
        dynamicFileNameValue,
        entityName,
        outputFileName,
        description,
        headerFormValues,
        bodyFormValues
      };
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
      return {
        fileType: storedFileType,
        toolId: storedToolId,
        fileSubtypeIndex: storedFileSubtypeIndex,
        dynamicFileNameValue: storedDynamicFileNameValue,
        entityName: storedEntityName,
        outputFileName: storedOutputFileName,
        description: storedDescription,
        headerFormValues: storedHeaderFormValues,
        bodyFormValues: storedBodyFormValues
      };
    }
  }

  persistSelections(
    fileType: FileType,
    toolId: string,
    fileSubtypeIndex: number,
    dynamicFileNameValue: string,
    entityName: string,
    outputFileName: string,
    description: string,
    headerFormValues: Record<string, string | string[]>,
    bodyFormValues: Record<string, string | string[]>
  ): void {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          fileType,
          toolId,
          fileSubtypeIndex,
          dynamicFileNameValue,
          entityName,
          outputFileName,
          description,
          headerFormValues,
          bodyFormValues
        })
      );
    } catch {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          fileType,
          toolId,
          fileSubtypeIndex,
          dynamicFileNameValue,
          entityName,
          outputFileName,
          description,
          headerFormValues,
          bodyFormValues
        })
      );
    }
  }

  private normalizeFormValues(value: unknown): Record<string, string | string[]> {
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
  defaultFileSubtypeIndex: number,
  defaultDynamicFileNameValue: string,
  defaultEntityName: string,
  defaultOutputFileName: string,
  defaultDescription: string,
  defaultHeaderFormValues: Record<string, string | string[]>,
  defaultBodyFormValues: Record<string, string | string[]>,
  aiTools: AiToolOption[]
): StoredSelections {
  return wizardStorageService.readStoredSelections(
    defaultFileType,
    defaultToolId,
    defaultFileSubtypeIndex,
    defaultDynamicFileNameValue,
    defaultEntityName,
    defaultOutputFileName,
    defaultDescription,
    defaultHeaderFormValues,
    defaultBodyFormValues,
    aiTools
  );
}

export function persistSelections(
  fileType: FileType,
  toolId: string,
  fileSubtypeIndex: number,
  dynamicFileNameValue: string,
  entityName: string,
  outputFileName: string,
  description: string,
  headerFormValues: Record<string, string | string[]>,
  bodyFormValues: Record<string, string | string[]>
): void {
  wizardStorageService.persistSelections(
    fileType,
    toolId,
    fileSubtypeIndex,
    dynamicFileNameValue,
    entityName,
    outputFileName,
    description,
    headerFormValues,
    bodyFormValues
  );
}

export function clearSelections(): void {
  wizardStorageService.clearSelections();
}