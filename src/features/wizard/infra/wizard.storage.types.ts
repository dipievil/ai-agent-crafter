import type { AiToolOption, FileType } from "@/types/wizard/common";

export type StoredSelections = {
	fileType: FileType;
	toolId: string;
};

export interface WizardStorageService {
	readStoredSelections(
		defaultFileType: FileType,
		defaultToolId: string,
		aiTools: AiToolOption[]
	): StoredSelections;
	persistSelections(fileType: FileType, toolId: string): void;
	clearSelections(): void;
}
