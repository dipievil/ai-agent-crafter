import type { TemplateSection } from "@/features/wizard/infra/wizard.form-schema.types";
import type { FileType } from "@/types/wizard/common";

export type TemplateSectionValues = Record<string, string | string[]>;

export type TemplateSectionStepProps = {
  selectedToolId: string;
  selectedFileSubtypeIndex: number;
  selectedType: FileType;
  entityName: string;
  entityDescription: string;
  values: TemplateSectionValues;
  onValuesChange: (values: TemplateSectionValues) => void;
  section: TemplateSection;
  translationNamespace: "Step5" | "Step6";
};
