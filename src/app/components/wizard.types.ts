export type FileType =
  | "agent-instructions"
  | "specific-instructions"
  | "prompts"
  | "skills";

export type FileTypes ={
  [key: string]: string;
}

export type FileTypeOption = {
  value: FileType;
  label: string;
};

export type AiToolData = {
  name: string;
  description: string;
  url: string;
};

export type AiToolOption = {
  id: string;
  name: string;
  description: string;
  url: string;
};

export type FileTypeStepProps = {
  selectedType: FileType;
  fileOptions: FileTypeOption[];
  onTypeChange: (type: FileType) => void;
};

export type AiTypeStepProps = {
  selectedToolId: string;
  aiTools: AiToolOption[];
  selectedToolDescription: string;
  selectedToolUrl?: string;
  onToolChange: (toolId: string) => void;
};

export type StepsWizardProps = {
  fileOptions: FileTypeOption[];
};
