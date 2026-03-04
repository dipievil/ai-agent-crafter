import aiToolsData from "@/data/ai-tools.json";
import type { FileType } from "@/types/wizard/common";

import type {
  BuildFormResult,
  FieldFormat,
  FieldInputType,
  FormField,
  ParseWarning,
  TemplateFormSchemaService,
  TemplateSection
} from "./wizard.form-schema.types";

type TranslationResolver = (key: string) => string | undefined;

type TemplateFieldRaw = {
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

type TemplateRaw = {
  header?: unknown;
  body?: unknown;
};

type FileNodeRaw = {
  name?: unknown;
  title?: unknown;
  template?: unknown;
};

type ToolNodeRaw = {
  files?: unknown;
};

const DEFAULT_NO_HEADER_MESSAGE = "this format file dont need a header";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeName(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-_]/g, "")
    .toLowerCase();
}

function defaultLabelFromName(name: string): string {
  const clean = name.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
  if (!clean) {
    return "Field";
  }

  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

function mapFormatToInputType(format: FieldFormat): FieldInputType {
  switch (format) {
    case "short":
      return "input-single-line";
    case "long":
      return "textarea";
    case "comma-list":
      return "tag-list-removable";
    case "list":
      return "dynamic-list-add-remove";
  }
}

function parseFormat(value: unknown): FieldFormat | undefined {
  if (value === "short" || value === "long" || value === "comma-list" || value === "list") {
    return value;
  }

  return undefined;
}

function withPath(path: string, message: string, code: ParseWarning["code"]): ParseWarning {
  return { code, message, path };
}

class JsonTemplateFormSchemaService implements TemplateFormSchemaService {
  constructor(private readonly resolveTranslation?: TranslationResolver) {}

  buildForm(
    aitype: string,
    filetype: FileType,
    filesection: TemplateSection,
    entityName: string,
    entityDescription: string,
    fileSubtypeIndex?: number
  ): BuildFormResult {
    const warnings: ParseWarning[] = [];
    const toolNode = this.getToolNode(aitype, warnings);

    if (!toolNode) {
      return this.emptyResult(aitype, filetype, filesection, warnings);
    }

    const fileNodes = this.getFileNodes(toolNode, filetype, warnings, aitype, fileSubtypeIndex);
    if (fileNodes.length === 0) {
      return this.emptyResult(aitype, filetype, filesection, warnings);
    }

    const fields = fileNodes.flatMap((node, index) =>
      this.mapFieldsFromNode(node, {
        aitype,
        filetype,
        filesection,
        entityName,
        entityDescription,
        nodeIndex: index,
        warnings
      })
    );

    const hasNoHeaderTemplate =
      filesection === "header" &&
      fileNodes.every((node) => !this.getTemplateFromNode(node));

    const message = hasNoHeaderTemplate ? DEFAULT_NO_HEADER_MESSAGE : undefined;

    return {
      meta: {
        aitype,
        filetype,
        filesection,
        message
      },
      section: {
        section: filesection,
        fields
      },
      warnings
    };
  }

  private emptyResult(
    aitype: string,
    filetype: FileType,
    filesection: TemplateSection,
    warnings: ParseWarning[]
  ): BuildFormResult {
    return {
      meta: {
        aitype,
        filetype,
        filesection
      },
      section: {
        section: filesection,
        fields: []
      },
      warnings
    };
  }

  private getToolNode(aitype: string, warnings: ParseWarning[]): ToolNodeRaw | undefined {
    const rawData = aiToolsData as Record<string, unknown>;
    const node = rawData[aitype];

    if (!isRecord(node)) {
      warnings.push(withPath(aitype, `Tool '${aitype}' was not found in ai-tools data`, "tool-not-found"));
      return undefined;
    }

    return node as ToolNodeRaw;
  }

  private getFileNodes(
    toolNode: ToolNodeRaw,
    filetype: FileType,
    warnings: ParseWarning[],
    aitype: string,
    fileSubtypeIndex?: number
  ): FileNodeRaw[] {
    if (!isRecord(toolNode.files)) {
      warnings.push(withPath(`${aitype}.files`, "Tool does not contain files configuration", "filetype-not-found"));
      return [];
    }

    const node = toolNode.files[filetype];
    if (!node) {
      warnings.push(withPath(`${aitype}.files.${filetype}`, "Requested file type was not found", "filetype-not-found"));
      return [];
    }

    if (Array.isArray(node)) {
      const validNodes = node.filter(isRecord) as FileNodeRaw[];

      if (typeof fileSubtypeIndex === "number") {
        if (fileSubtypeIndex < 0 || fileSubtypeIndex >= validNodes.length) {
          warnings.push(
            withPath(
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

    warnings.push(withPath(`${aitype}.files.${filetype}`, "Invalid file type node format", "filetype-not-found"));
    return [];
  }

  private getTemplateFromNode(node: FileNodeRaw): TemplateRaw | undefined {
    if (!isRecord(node.template)) {
      return undefined;
    }

    return node.template as TemplateRaw;
  }

  private getFieldsBySection(
    template: TemplateRaw,
    section: TemplateSection,
    warnings: ParseWarning[],
    path: string
  ): TemplateFieldRaw[] {
    const sectionNode = template[section];
    if (!sectionNode) {
      warnings.push(withPath(path, `Template does not contain '${section}' section`, "section-not-found"));
      return [];
    }

    if (!Array.isArray(sectionNode)) {
      warnings.push(withPath(path, `Template '${section}' section must be an array`, "section-not-found"));
      return [];
    }

    return sectionNode.filter(isRecord) as TemplateFieldRaw[];
  }

  private mapFieldsFromNode(
    node: FileNodeRaw,
    context: {
      aitype: string;
      filetype: FileType;
      filesection: TemplateSection;
      entityName: string;
      entityDescription: string;
      nodeIndex: number;
      warnings: ParseWarning[];
    }
  ) {
    const template = this.getTemplateFromNode(node);
    if (!template) {
      context.warnings.push(
        withPath(
          `${context.aitype}.files.${context.filetype}[${context.nodeIndex}].template`,
          "Template definition was not found for this file node",
          "template-not-found"
        )
      );
      return [];
    }

    const sectionPath = `${context.aitype}.files.${context.filetype}[${context.nodeIndex}].template.${context.filesection}`;
    const rawFields = this.getFieldsBySection(template, context.filesection, context.warnings, sectionPath);

    return rawFields
      .map((field, fieldIndex) => this.mapField(field, context, fieldIndex))
      .filter((field): field is NonNullable<typeof field> => Boolean(field));
  }

  private mapField(
    field: TemplateFieldRaw,
    context: {
      aitype: string;
      filetype: FileType;
      filesection: TemplateSection;
      entityName: string;
      entityDescription: string;
      nodeIndex: number;
      warnings: ParseWarning[];
    },
    fieldIndex: number
  ): FormField | undefined {
    const rawName = typeof field.name === "string" ? field.name : "";
    if (!rawName) {
      context.warnings.push(
        withPath(
          `${context.aitype}.files.${context.filetype}[${context.nodeIndex}].template.${context.filesection}[${fieldIndex}]`,
          "Template field is missing a valid name",
          "invalid-section-item"
        )
      );
      return undefined;
    }

    const normalizedName = normalizeName(rawName);
    const rawFormat = field.format ?? field.formInput;
    const parsedFormat = parseFormat(rawFormat);
    const format: FieldFormat = parsedFormat ?? "short";

    if (!parsedFormat && rawFormat !== undefined) {
      context.warnings.push(
        withPath(
          `${context.aitype}.files.${context.filetype}[${context.nodeIndex}].template.${context.filesection}[${fieldIndex}].format`,
          `Unsupported format '${String(rawFormat)}'. Falling back to 'short'`,
          "unsupported-format"
        )
      );
    }

    const labelKey = this.createTranslationKey(context, normalizedName, "formLabel");
    const hintKey = this.createTranslationKey(context, normalizedName, "formHint");

    const translatedLabel = this.resolveTranslation?.(labelKey);
    const translatedHint = this.resolveTranslation?.(hintKey);

    if (!translatedLabel && this.resolveTranslation) {
      context.warnings.push(withPath(labelKey, "Translation key not found for label", "translation-missing"));
    }

    const fallbackHint = typeof field.formHint === "string" ? field.formHint : typeof field.hint === "string" ? field.hint : undefined;

    if (!translatedHint && this.resolveTranslation && typeof fallbackHint === "string") {
      context.warnings.push(withPath(hintKey, "Translation key not found for hint", "translation-missing"));
    }

    const label = translatedLabel ?? defaultLabelFromName(rawName);
    const hint = translatedHint ?? fallbackHint;
    const required = field.required === true;

    return {
      id: `${context.filetype}-${context.filesection}-${context.nodeIndex}-${fieldIndex}-${normalizedName}`,
      name: normalizedName,
      section: context.filesection,
      label,
      labelKey,
      hint,
      hintKey,
      inputType: mapFormatToInputType(format),
      format,
      required,
      variant: required ? "required" : "default",
      value: this.resolveFieldValue(normalizedName, context.entityName, context.entityDescription),
      variable: typeof field.variable === "string" ? field.variable : undefined,
      description: typeof field.description === "string" ? field.description : undefined,
      sectionName: typeof field.sectionName === "string" ? field.sectionName : undefined,
      type: typeof field.type === "string" ? field.type : typeof field.sectionType === "string" ? field.sectionType : undefined
    };
  }

  private createTranslationKey(
    context: {
      aitype: string;
      filetype: FileType;
      filesection: TemplateSection;
    },
    fieldName: string,
    leaf: "formLabel" | "formHint"
  ): string {
    const leafItem = leaf === "formLabel" ? "label" : "hint";
    return `templates.${context.aitype}.${context.filetype}.${context.filesection}.${fieldName}.${leafItem}`;
  }

  private resolveFieldValue(name: string, entityName: string, entityDescription: string): string | undefined {
    if (name === "name") {
      return entityName;
    }

    if (name === "description") {
      return entityDescription;
    }

    return undefined;
  }
}

export function createTemplateFormSchemaService(resolveTranslation?: TranslationResolver): TemplateFormSchemaService {
  return new JsonTemplateFormSchemaService(resolveTranslation);
}

const templateFormSchemaService: TemplateFormSchemaService = createTemplateFormSchemaService();

export function buildTemplateForm(
  aitype: string,
  filetype: FileType,
  filesection: TemplateSection,
  entityName: string,
  entityDescription: string,
  fileSubtypeIndex?: number
): BuildFormResult {
  return templateFormSchemaService.buildForm(
    aitype,
    filetype,
    filesection,
    entityName,
    entityDescription,
    fileSubtypeIndex
  );
}
