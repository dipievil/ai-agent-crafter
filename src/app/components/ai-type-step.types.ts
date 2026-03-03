import type { AiToolOption } from "./wizard.types";

export type AiTypeStepProps = {
  selectedToolId: string;
  aiTools: AiToolOption[];
  onToolChange: (toolId: string) => void;
  onBack: () => void;
};
