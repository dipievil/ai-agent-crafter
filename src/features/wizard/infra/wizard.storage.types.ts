import type { AiToolOption, FileType } from "@/types/wizard/common";

export type StoredSelections = {
	fileType: FileType;
	toolId: string;
	fileName: string;
	description: string;
};

export interface WizardStorageService {
	readStoredSelections(
		defaultFileType: FileType,
		defaultToolId: string,
		defaultFileName: string,
		defaultDescription: string,
		aiTools: AiToolOption[]
	): StoredSelections;
	persistSelections(fileType: FileType, toolId: string, fileName: string, description: string): void;
	clearSelections(): void;
}
