import aiToolsData from "@/data/ai-tools.json";
import type { FileType } from "@/types/wizard/common";

import type { ParseWarning, ParseWarningCode, TemplateSection } from "./wizard/infra/wizard.form-schema.types";

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

type ToolNodeRaw = {
  files?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function normalizeFieldName(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-_]/g, "")
    .toLowerCase();
}

export function withParseWarning(
  path: string,
  message: string,
  code: ParseWarningCode
): ParseWarning {
  return { code, message, path };
}

export function resolveTemplateFileNodes(
  aitype: string,
  filetype: FileType,
  warnings: ParseWarning[],
  fileSubtypeIndex?: number
): FileNodeRaw[] {
  const rawData = aiToolsData as Record<string, unknown>;
  const toolNode = rawData[aitype];

  if (!isRecord(toolNode)) {
    warnings.push(
      withParseWarning(aitype, `Tool '${aitype}' was not found in ai-tools data`, "tool-not-found")
    );
    return [];
  }

  const filesNode = (toolNode as ToolNodeRaw).files;
  if (!isRecord(filesNode)) {
    warnings.push(
      withParseWarning(`${aitype}.files`, "Tool does not contain files configuration", "filetype-not-found")
    );
    return [];
  }

  const node = filesNode[filetype];
  if (!node) {
    warnings.push(
      withParseWarning(
        `${aitype}.files.${filetype}`,
        "Requested file type was not found",
        "filetype-not-found"
      )
    );
    return [];
  }

  if (Array.isArray(node)) {
    const validNodes = node.filter(isRecord) as FileNodeRaw[];

    if (typeof fileSubtypeIndex === "number") {
      if (fileSubtypeIndex < 0 || fileSubtypeIndex >= validNodes.length) {
        warnings.push(
          withParseWarning(
            `${aitype}.files.${filetype}[${fileSubtypeIndex}]`,
            "Requested file subtype index was not found",
            "filetype-not-found"
          )
        );
        return [];
      }

      return [validNodes[fileSubtypeIndex]];
    }

    return validNodes;
  }

  if (isRecord(node)) {
    return [node as FileNodeRaw];
  }

  warnings.push(
    withParseWarning(`${aitype}.files.${filetype}`, "Invalid file type node format", "filetype-not-found")
  );
  return [];
}

export function getTemplateFromNode(node: FileNodeRaw): TemplateRaw | undefined {
  if (!isRecord(node.template)) {
    return undefined;
  }

  return node.template as TemplateRaw;
}

export function getTemplateSectionFields(
  template: TemplateRaw,
  section: TemplateSection,
  warnings: ParseWarning[],
  path: string
): TemplateFieldRaw[] {
  const sectionNode = template[section];
  if (!sectionNode) {
    warnings.push(
      withParseWarning(path, `Template does not contain '${section}' section`, "section-not-found")
    );
    return [];
  }

  if (!Array.isArray(sectionNode)) {
    warnings.push(
      withParseWarning(path, `Template '${section}' section must be an array`, "section-not-found")
    );
    return [];
  }

  return sectionNode.filter(isRecord) as TemplateFieldRaw[];
}