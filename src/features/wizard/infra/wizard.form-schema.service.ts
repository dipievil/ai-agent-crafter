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
import {
  type FileNodeRaw,
  getTemplateFromNode,
  getTemplateSectionFields,
  normalizeFieldName,
  resolveTemplateFileNodes,
  withParseWarning,
  type TemplateFieldRaw
} from "../../template-data.shared";

type TranslationResolver = (key: string) => string | undefined;

const DEFAULT_NO_HEADER_MESSAGE = "this format file dont need a header";

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
    const fileNodes = resolveTemplateFileNodes(aitype, filetype, warnings, fileSubtypeIndex);
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
        withParseWarning(
          `${context.aitype}.files.${context.filetype}[${context.nodeIndex}].template`,
          "Template definition was not found for this file node",
          "template-not-found"
        )
      );
      return [];
    }

    const sectionPath = `${context.aitype}.files.${context.filetype}[${context.nodeIndex}].template.${context.filesection}`;
    const rawFields = getTemplateSectionFields(template, context.filesection, context.warnings, sectionPath);

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
    if (field.sectionType === "title") {
      return undefined;
    }

    const rawName = typeof field.name === "string" ? field.name : "";
    if (!rawName) {
      context.warnings.push(
        withParseWarning(
          `${context.aitype}.files.${context.filetype}[${context.nodeIndex}].template.${context.filesection}[${fieldIndex}]`,
          "Template field is missing a valid name",
          "invalid-section-item"
        )
      );
      return undefined;
    }

    const normalizedName = normalizeFieldName(rawName);
    const rawFormat = field.format ?? field.formInput;
    const parsedFormat = parseFormat(rawFormat);
    const format: FieldFormat = parsedFormat ?? "short";

    if (!parsedFormat && rawFormat !== undefined) {
      context.warnings.push(
        withParseWarning(
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
      context.warnings.push(withParseWarning(labelKey, "Translation key not found for label", "translation-missing"));
    }

    const fallbackHint = typeof field.formHint === "string" ? field.formHint : typeof field.hint === "string" ? field.hint : undefined;

    if (!translatedHint && this.resolveTranslation && typeof fallbackHint === "string") {
      context.warnings.push(withParseWarning(hintKey, "Translation key not found for hint", "translation-missing"));
    }

    const label = translatedLabel ?? defaultLabelFromName(rawName);
    const hint = translatedHint ?? fallbackHint;
    const required = field.required === true;

    return {
      id: `${context.filetype}-${context.filesection}-${context.nodeIndex}-${fieldIndex}-${normalizedName}`,
      name: normalizedName,
      sourceName: rawName,
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

  private getTemplateFromNode(node: {
    name?: unknown;
    title?: unknown;
    template?: unknown;
  }) {
    return getTemplateFromNode(node);
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
