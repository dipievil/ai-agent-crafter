import type { MarkdownBuildWarning, MarkdownBuildError } from "@/types/wizard/common";

import type { FileType } from "@/types/wizard/common";

export type MarkdownBuilderInput = {
  aitype: string;
  filetype: FileType;
  entityName: string;
  entityDescription: string;
  headerFormValues: Record<string, string | string[]>;
  bodyFormValues: Record<string, string | string[]>;
  fileSubtypeIndex?: number;
};

export type MarkdownBuildResult = {
  meta: {
    aitype: string;
    filetype: FileType;
    fileSubtypeIndex: number;
  };
  output: {
    header: string;
    body: string;
    markdown: string;
  };
  warnings: MarkdownBuildWarning[];
};

export interface WizardMarkdownBuilderService {
  buildMarkdown(input: MarkdownBuilderInput): MarkdownBuildResult;
}
