import type { FileType } from "@/types/wizard/common";
import type { TemplateSectionValues } from "../template-section.types";

export type TemplateHeaderStepProps = {
  selectedToolId: string;
  selectedFileSubtypeIndex: number;
  selectedType: FileType;
  entityName: string;
  entityDescription: string;
  values: TemplateSectionValues;
  onValuesChange: (values: TemplateSectionValues) => void;
};
