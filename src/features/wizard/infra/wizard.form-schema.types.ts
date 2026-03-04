import type { FileType, TemplateSection, ParseWarning } from "@/types/wizard/common";

export type FieldVariant = "default" | "required";

export type FieldFormat = "short" | "long" | "comma-list" | "list";

export type FieldInputType =
  | "input-single-line"
  | "textarea"
  | "tag-list-removable"
  | "dynamic-list-add-remove";

export type BuildFormInput = {
  aitype: string;
  filetype: FileType;
  filesection: TemplateSection;
  entityName: string;
  entityDescription: string;
  fileSubtypeIndex?: number;
};

export type FormField = {
  id: string;
  name: string;
  sourceName?: string;
  section: TemplateSection;
  label: string;
  labelKey: string;
  hint?: string;
  hintKey: string;
  inputType: FieldInputType;
  format: FieldFormat;
  required: boolean;
  variant: FieldVariant;
  value?: string;
  variable?: string;
  description?: string;
  sectionName?: string;
  type?: string;
};

export type FormSectionData = {
  section: TemplateSection;
  fields: FormField[];
};

export type BuildFormResult = {
  meta: {
    aitype: string;
    filetype: FileType;
    filesection: TemplateSection;
    message?: string;
  };
  section: FormSectionData;
  warnings: ParseWarning[];
};

export interface TemplateFormSchemaService {
  buildForm(
    aitype: string,
    filetype: FileType,
    filesection: TemplateSection,
    entityName: string,
    entityDescription: string,
    fileSubtypeIndex?: number
  ): BuildFormResult;
}
