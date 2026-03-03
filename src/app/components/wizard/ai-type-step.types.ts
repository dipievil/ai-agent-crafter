import { AiToolOption } from "@/types/wizard/aiTools";

export type AiTypeStepProps = {
  selectedToolId: string;
  aiTools: AiToolOption[];
  onToolChange: (toolId: string) => void;
  onBack: () => void;
};