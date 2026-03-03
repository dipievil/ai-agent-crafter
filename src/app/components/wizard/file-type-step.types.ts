import { FileType, FileTypeOption } from "@/types/wizard/templateFiles";

export type FileTypeStepProps = {
  selectedType: FileType;
  fileOptions: FileTypeOption[];
  onTypeChange: (type: FileType) => void;
};
