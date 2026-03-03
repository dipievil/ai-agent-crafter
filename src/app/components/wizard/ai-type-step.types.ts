import { AiToolOption } from "@/types/wizard/common";

export type AiTypeStepProps = {
  selectedToolId: string;
  aiTools: AiToolOption[];
  onToolChange: (toolId: string) => void;
  onBack: () => void;
};