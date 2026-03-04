export type AiToolData = {
  name: string;
  description: string;
  url: string;
};

export type AiToolOption = {
  id: string;
  name: string;
  description: string;
  url: string;
};

export type FileType =
  | "agent-instructions"
  | "specific-instructions"
  | "prompts"
  | "skills";
  
export type FileTypes ={
  [key: string]: string;
}

export type FileTypeOption = {
  value: FileType;
  label: string;
};

export type ParseErrorCode =
  | "tool-not-found"
  | "files-not-found"
  | "filetype-not-found"
  | "template-not-found"
  | "section-not-found"
  | "invalid-section-item"
  | "unsupported-format"

export type ParseWarningCode =
  | "translation-missing";

export type ParseWarning = {
  code: ParseWarningCode | ParseErrorCode;
  message: string;
  path?: string;
};

export type MarkdownBuildErrorCode =
  | ParseErrorCode
  | "section-type-inferred"
  | "section-type-unsupported"
  | "value-shape-mismatch";

export type MarkdownBuildWarningCode =
  | ParseWarningCode
  | "section-type-inferred"
  | "section-type-unsupported";

export type MarkdownBuildWarning = {
  code: MarkdownBuildWarningCode | MarkdownBuildErrorCode;
  message: string;
  path?: string;
};

export type MarkdownBuildError = {
  code: MarkdownBuildErrorCode;
  message: string;
  path?: string;
};

export type TemplateSection = "header" | "body";

export type TemplateFieldRaw = {
  name?: unknown;
  hint?: unknown;
  formHint?: unknown;
  format?: unknown;
  formInput?: unknown;
  required?: unknown;
  variable?: unknown;
  description?: unknown;
  sectionName?: unknown;
  type?: unknown;
  sectionType?: unknown;
};

export type TemplateRaw = {
  header?: unknown;
  body?: unknown;
};

export type FileNodeRaw = {
  name?: unknown;
  title?: unknown;
  template?: unknown;
};