import type { AiToolOption, FileType } from "@/types/wizard/common";

export type StoredSelections = {
	fileType: FileType;
	toolId: string;
	fileName: string;
	description: string;
	headerFormValues: Record<string, string | string[]>;
};

export interface WizardStorageService {
	readStoredSelections(
		defaultFileType: FileType,
		defaultToolId: string,
		defaultFileName: string,
		defaultDescription: string,
		defaultHeaderFormValues: Record<string, string | string[]>,
		aiTools: AiToolOption[]
	): StoredSelections;
	persistSelections(
		fileType: FileType,
		toolId: string,
		fileName: string,
		description: string,
		headerFormValues: Record<string, string | string[]>
	): void;
	clearSelections(): void;
}
