import type { FileType } from "@/types/wizard/common";

export type EntityDescriptionStepProps = {
  selectedType: FileType;
  description: string;
  onDescriptionChange: (value: string) => void;
};