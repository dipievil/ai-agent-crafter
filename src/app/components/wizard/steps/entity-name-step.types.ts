import type { FileType } from "@/types/wizard/common";

export type EntityNameStepProps = {
  selectedType: FileType;
  fileName: string;
  onFileNameChange: (name: string) => void;
};
