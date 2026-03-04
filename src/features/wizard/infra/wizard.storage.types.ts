import type { AiToolOption, FileType } from "@/types/wizard/common";

export type StoredSelections = {
	fileType: FileType;
	toolId: string;
	fileSubtypeIndex: number;
	entityName: string;
	outputFileName: string;
	description: string;
	headerFormValues: Record<string, string | string[]>;
	bodyFormValues: Record<string, string | string[]>;
};

export interface WizardStorageService {
	readStoredSelections(
		defaultFileType: FileType,
		defaultToolId: string,
		defaultFileSubtypeIndex: number,
		defaultEntityName: string,
		defaultOutputFileName: string,
		defaultDescription: string,
		defaultHeaderFormValues: Record<string, string | string[]>,
		defaultBodyFormValues: Record<string, string | string[]>,
		aiTools: AiToolOption[]
	): StoredSelections;
	persistSelections(
		fileType: FileType,
		toolId: string,
		fileSubtypeIndex: number,
		entityName: string,
		outputFileName: string,
		description: string,
		headerFormValues: Record<string, string | string[]>,
		bodyFormValues: Record<string, string | string[]>
	): void;
	clearSelections(): void;
}
