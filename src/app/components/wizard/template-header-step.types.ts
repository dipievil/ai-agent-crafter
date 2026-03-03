import type { FileType } from "@/types/wizard/common";

export type TemplateHeaderStepProps = {
  selectedToolId: string;
  selectedType: FileType;
  entityName: string;
  entityDescription: string;
  values: Record<string, string | string[]>;
  onValuesChange: (values: Record<string, string | string[]>) => void;
};
