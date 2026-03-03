import { FileType, FileTypeOption } from "@/types/wizard/common";

export type FileTypeStepProps = {
  selectedType: FileType;
  fileOptions: FileTypeOption[];
  onTypeChange: (type: FileType) => void;
};
