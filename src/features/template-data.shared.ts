import aiToolsData from "@/data/ai-tools.json";
import agentTemplateData from "@/data/agent.template.json";
import instructionsTemplateData from "@/data/instructions.template.json";
import promtpsTemplateData from "@/data/promtps.template.json";
import skillsTemplateData from "@/data/skills.template.json";
import type { 
  TemplateSection,
  TemplateFieldRaw,
  TemplateRaw,
  FileNodeRaw,
  FileType,
  ParseWarningCode,
  ParseWarning, ParseErrorCode } from "@/types/wizard/common";

type ToolNodeRaw = {
  files?: unknown;
};

type TemplatesByFileType = Record<FileType, Record<string, unknown>>;

const templatesByFileType: TemplatesByFileType = {
  "agent-instructions": agentTemplateData as Record<string, unknown>,
  "specific-instructions": instructionsTemplateData as Record<string, unknown>,
  prompts: promtpsTemplateData as Record<string, unknown>,
  skills: skillsTemplateData as Record<string, unknown>
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

export function normalizeLettersOnly(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z]/g, "")
    .toLowerCase();
}

export function withParseWarning(
  path: string,
  message: string,
  code: ParseWarningCode | ParseErrorCode
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

export function resolveTemplateFromNode(
  node: FileNodeRaw,
  filetype: FileType,
  warnings: ParseWarning[],
  path: string
): TemplateRaw | undefined {
  const templateId = typeof node.template === "string" ? node.template.trim() : "";
  if (!templateId) {
    warnings.push(withParseWarning(path, "Template definition was not found for this file node", "template-not-found"));
    return undefined;
  }

  const templatesRegistry = templatesByFileType[filetype];
  if (!isRecord(templatesRegistry)) {
    warnings.push(withParseWarning(path, `Template registry for file type '${filetype}' was not found`, "template-not-found"));
    return undefined;
  }

  const templateNode = templatesRegistry[templateId];
  if (!isRecord(templateNode)) {
    warnings.push(withParseWarning(path, `Template '${templateId}' was not found for file type '${filetype}'`, "template-not-found"));
    return undefined;
  }

  return templateNode as TemplateRaw;
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