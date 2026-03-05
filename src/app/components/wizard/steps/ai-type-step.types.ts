import { AiToolOption } from "@/types/wizard/common";

export type FileSubtypeOption = {
  index: number;
  label: string;
};

export type FileNameSegmentField = {
  key: string;
  name: string;
  hint?: string;
  required: boolean;
  defaultValue?: string;
};

export type AiTypeStepProps = {
  selectedToolId: string;
  aiTools: AiToolOption[];
  onToolChange: (toolId: string) => void;
  selectedFileSubtypeIndex: number;
  fileSubtypeOptions: FileSubtypeOption[];
  onFileSubtypeChange: (subtypeIndex: number) => void;
  fileHint?: string;
};