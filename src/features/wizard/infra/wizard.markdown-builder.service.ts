import type {
  MarkdownBuildResult,
  MarkdownBuildWarning,
  MarkdownBuildWarningCode,
  MarkdownBuilderInput,
  WizardMarkdownBuilderService
} from "./wizard.markdown-builder.types";
import {
  getTemplateFromNode,
  getTemplateSectionFields,
  normalizeFieldName,
  resolveTemplateFileNodes,
  type TemplateFieldRaw
} from "../../template-data.shared";

import type { FileType } from "@/types/wizard/common";

type MarkdownSectionType =
  | "main-section"
  | "second-section"
  | "list"
  | "list-simple"
  | "value-key"
  | "array-key"
  | "objects-key"
  | "title";

type MarkdownField = {
  name: string;
  sourceName: string;
  sectionName?: string;
  type?: string;
  variable?: string;
  value?: string;
};

const MARKDOWN_SECTION_TYPES: ReadonlySet<string> = new Set([
  "main-section",
  "second-section",
  "list",
  "list-simple",
  "value-key",
  "array-key",
  "objects-key",
  "title"
]);

function withWarning(
  code: MarkdownBuildWarningCode,
  message: string,
  path?: string
): MarkdownBuildWarning {
  return { code, message, path };
}

function sanitizeKeyName(value: string | undefined): string {
  if (!value) {
    return "";
  }

  return value.trim().replace(/:+$/, "");
}

function normalizeTextValue(value: string | string[] | undefined): string {
  if (!value) {
    return "";
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => item.trim())
      .filter(Boolean)
      .join(", ");
  }

  return value.trim();
}

function normalizeListValue(value: string | string[] | undefined): string[] {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map((item) => item.trim()).filter(Boolean);
  }

  return value
    .split(/\n|,/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

class JsonWizardMarkdownBuilderService implements WizardMarkdownBuilderService {
  buildMarkdown(input: MarkdownBuilderInput): MarkdownBuildResult {
    const fileSubtypeIndex = input.fileSubtypeIndex ?? 0;

    const warnings: MarkdownBuildWarning[] = [];
    const headerFields = this.buildFieldsBySection(input, "header", warnings, fileSubtypeIndex);
    const bodyFields = this.buildFieldsBySection(input, "body", warnings, fileSubtypeIndex);

    const headerLines = this.renderFields(
      headerFields,
      input.headerFormValues,
      "header",
      warnings,
      input.aitype,
      input.filetype
    );
    const bodyBlocks = this.renderFields(
      bodyFields,
      input.bodyFormValues,
      "body",
      warnings,
      input.aitype,
      input.filetype
    );

    const header = headerLines.length > 0 ? `---\n${headerLines.join("\n")}\n---` : "";
    const body = bodyBlocks.join("\n\n").trim();
    const markdown = [header, body].filter(Boolean).join("\n\n").trim();

    return {
      meta: {
        aitype: input.aitype,
        filetype: input.filetype,
        fileSubtypeIndex
      },
      output: {
        header,
        body,
        markdown
      },
      warnings
    };
  }

  private buildFieldsBySection(
    input: MarkdownBuilderInput,
    section: "header" | "body",
    warnings: MarkdownBuildWarning[],
    fileSubtypeIndex: number
  ): MarkdownField[] {
    const parseWarnings = [] as Parameters<typeof resolveTemplateFileNodes>[2];
    const fileNodes = resolveTemplateFileNodes(
      input.aitype,
      input.filetype,
      parseWarnings,
      fileSubtypeIndex
    );

    warnings.push(
      ...parseWarnings.map((warning) =>
        withWarning(warning.code, warning.message, warning.path)
      )
    );

    if (fileNodes.length === 0) {
      return [];
    }

    return fileNodes.flatMap((node, nodeIndex) => {
      const template = getTemplateFromNode(node);
      if (!template) {
        warnings.push(
          withWarning(
            "template-not-found",
            "Template definition was not found for this file node",
            `${input.aitype}.files.${input.filetype}[${nodeIndex}].template`
          )
        );
        return [];
      }

      const sectionWarnings = [] as Parameters<typeof getTemplateSectionFields>[2];
      const sectionPath = `${input.aitype}.files.${input.filetype}[${nodeIndex}].template.${section}`;
      const fields = getTemplateSectionFields(template, section, sectionWarnings, sectionPath);

      warnings.push(
        ...sectionWarnings.map((warning) =>
          withWarning(warning.code, warning.message, warning.path)
        )
      );

      return fields
        .map((field, fieldIndex) =>
          this.mapRawFieldToMarkdownField(field, input, section, nodeIndex, fieldIndex, warnings)
        )
        .filter((field): field is MarkdownField => Boolean(field));
    });
  }

  private mapRawFieldToMarkdownField(
    field: TemplateFieldRaw,
    input: MarkdownBuilderInput,
    section: "header" | "body",
    nodeIndex: number,
    fieldIndex: number,
    warnings: MarkdownBuildWarning[]
  ): MarkdownField | undefined {
    if (field.sectionType === "title") {
      return undefined;
    }

    const rawName = typeof field.name === "string" ? field.name : "";
    if (!rawName) {
      warnings.push(
        withWarning(
          "invalid-section-item",
          "Template field is missing a valid name",
          `${input.aitype}.files.${input.filetype}[${nodeIndex}].template.${section}[${fieldIndex}]`
        )
      );
      return undefined;
    }

    const normalizedName = normalizeFieldName(rawName);
    const rawType = typeof field.type === "string" ? field.type : undefined;
    const rawSectionType = typeof field.sectionType === "string" ? field.sectionType : undefined;

    return {
      name: normalizedName,
      sourceName: rawName,
      sectionName: typeof field.sectionName === "string" ? field.sectionName : undefined,
      type: rawType ?? rawSectionType,
      variable: typeof field.variable === "string" ? field.variable : undefined,
      value: this.resolveFieldValue(normalizedName, input.entityName, input.entityDescription)
    };
  }

  private resolveFieldValue(
    name: string,
    entityName: string,
    entityDescription: string
  ): string | undefined {
    if (name === "name") {
      return entityName;
    }

    if (name === "description") {
      return entityDescription;
    }

    return undefined;
  }

  private resolveSectionType(
    field: MarkdownField,
    section: "header" | "body",
    warnings: MarkdownBuildWarning[],
    path: string
  ): MarkdownSectionType {
    const rawType = typeof field.type === "string" ? field.type.trim().toLowerCase() : "";
    if (!rawType) {
      const inferredType: MarkdownSectionType = section === "header" ? "value-key" : "main-section";
      warnings.push(
        withWarning(
          "section-type-inferred",
          `Field '${field.name}' has no section type and will use '${inferredType}'`,
          path
        )
      );
      return inferredType;
    }

    if (rawType === "object-key") {
      warnings.push(
        withWarning(
          "section-type-alias",
          `Field '${field.name}' uses 'object-key'. Using 'objects-key' alias`,
          path
        )
      );
      return "objects-key";
    }

    if (!MARKDOWN_SECTION_TYPES.has(rawType)) {
      const fallbackType: MarkdownSectionType = section === "header" ? "value-key" : "main-section";
      warnings.push(
        withWarning(
          "section-type-unsupported",
          `Field '${field.name}' has unsupported section type '${rawType}'. Using '${fallbackType}'`,
          path
        )
      );
      return fallbackType;
    }

    return rawType as MarkdownSectionType;
  }

  private getFieldValue(
    field: MarkdownField,
    values: Record<string, string | string[]>
  ): string | string[] | undefined {
    const providedValue = values[field.name];

    if (providedValue !== undefined) {
      return providedValue;
    }

    return field.value;
  }

  private renderFields(
    fields: MarkdownField[],
    values: Record<string, string | string[]>,
    section: "header" | "body",
    warnings: MarkdownBuildWarning[],
    aitype: string,
    filetype: FileType
  ): string[] {
    return fields
      .map((field, index) => {
        const path = `${aitype}.files.${filetype}.${section}[${index}]`;
        const sectionType = this.resolveSectionType(field, section, warnings, path);
        const value = this.getFieldValue(field, values);

        return this.renderField(field, sectionType, value, warnings, path);
      })
      .filter((part): part is string => Boolean(part));
  }

  private renderField(
    field: MarkdownField,
    sectionType: MarkdownSectionType,
    value: string | string[] | undefined,
    warnings: MarkdownBuildWarning[],
    path: string
  ): string | undefined {
    const sectionName =
      sanitizeKeyName(field.sectionName) || sanitizeKeyName(field.sourceName) || field.name;
    const keyName = sanitizeKeyName(field.sourceName) || field.name;

    if (sectionType === "title") {
      return `# ${sectionName}`;
    }

    if (
      sectionType === "list" ||
      sectionType === "list-simple" ||
      sectionType === "array-key" ||
      sectionType === "objects-key"
    ) {
      const items = normalizeListValue(value);

      if (items.length === 0) {
        return undefined;
      }

      if (typeof value === "string") {
        warnings.push(
          withWarning(
            "value-shape-mismatch",
            `Field '${field.name}' expected list-like value and received plain text. Converting automatically`,
            path
          )
        );
      }

      if (sectionType === "list") {
        return `## ${sectionName}\n${items.map((item) => `- ${item}`).join("\n")}`;
      }

      if (sectionType === "list-simple") {
        return items.map((item) => `- ${item}`).join("\n");
      }

      if (sectionType === "array-key") {
        return `${keyName}: ${JSON.stringify(items)}`;
      }

      const objectValueKey = sanitizeKeyName(field.variable) || "value";
      return `${keyName}: ${JSON.stringify(items.map((item) => ({ [objectValueKey]: item })) )}`;
    }

    const text = normalizeTextValue(value);
    if (!text) {
      return undefined;
    }

    if (sectionType === "main-section") {
      return `# ${sectionName}\n\n${text}`;
    }

    if (sectionType === "second-section") {
      return `## ${sectionName}\n\n${text}`;
    }

    return `${keyName}: ${text}`;
  }
}

export function createWizardMarkdownBuilderService(): WizardMarkdownBuilderService {
  return new JsonWizardMarkdownBuilderService();
}

const wizardMarkdownBuilderService: WizardMarkdownBuilderService =
  createWizardMarkdownBuilderService();

export function buildTemplateMarkdown(input: MarkdownBuilderInput): MarkdownBuildResult {
  return wizardMarkdownBuilderService.buildMarkdown(input);
}
