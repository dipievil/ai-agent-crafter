import type { AiToolOption, FileType } from "@/types/wizard/common";

export type StoredSelections = {
	fileType: FileType;
	toolId: string;
	fileName: string;
};

export interface WizardStorageService {
	readStoredSelections(
		defaultFileType: FileType,
		defaultToolId: string,
		defaultFileName: string,
		aiTools: AiToolOption[]
	): StoredSelections;
	persistSelections(fileType: FileType, toolId: string, fileName: string): void;
	clearSelections(): void;
}
