import type { FileType } from "@/types/wizard/common";

export type FileNameStepProps = {
  selectedType: FileType;
  fileName: string;
  onFileNameChange: (name: string) => void;
};
