import type { FileType} from  "@/types/wizard/templateFiles"
import type { AiToolOption } from "@/types/wizard/aiTools";

export type SummarySectionProps = {
  currentStep: number;
  selectedType?: FileType | null;
  selectedToolId?: string;
  aiTools: AiToolOption[];
  onToolChange: (toolId: string) => void;
};