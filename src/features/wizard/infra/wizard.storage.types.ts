import type { AiToolOption } from "@/types/wizard/aiTools";
import type { FileType } from "@/types/wizard/templateFiles";

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
