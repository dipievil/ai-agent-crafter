import type { FileType } from "@/types/wizard/common";

export type EntityNameStepProps = {
  selectedType: FileType;
  entityName: string;
  onEntityNameChange: (name: string) => void;
};
