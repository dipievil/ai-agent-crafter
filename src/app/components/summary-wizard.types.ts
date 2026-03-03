import type { AiToolOption, FileType} from  "@/types/wizard/common"

export type SummarySectionProps = {
  currentStep: number;
  selectedType?: FileType | null;
  selectedToolId?: string;
  fileName?: string;
  aiTools: AiToolOption[];
};