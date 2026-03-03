import type { FileType, AiToolOption } from "./wizard.types";

export type SummarySectionProps = {
  currentStep: number;
  selectedType?: FileType | null;
  selectedToolId?: string;
  aiTools: AiToolOption[];
  onToolChange: (toolId: string) => void;
};