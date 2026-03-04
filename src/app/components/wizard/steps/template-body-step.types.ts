import type { TemplateSectionValues } from "../template-section.types";
import type { FileType } from "@/types/wizard/common";

export type TemplateBodyStepProps = {
  selectedToolId: string;
  selectedFileSubtypeIndex: number;
  selectedType: FileType;
  entityName: string;
  entityDescription: string;
  values: TemplateSectionValues;
  onValuesChange: (values: TemplateSectionValues) => void;
};
