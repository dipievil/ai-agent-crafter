import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { createTemplateFormSchemaService } from "@/features/wizard/infra/wizard.form-schema.service";
import type { FormField } from "@/features/wizard/infra/wizard.form-schema.types";

import type { TemplateSectionStepProps } from "./template-section.types";

function ensureArrayValue(value: string | string[] | undefined): string[] {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : value.split(",").map((item) => item.trim()).filter(Boolean);
}

function ensureStringValue(value: string | string[] | undefined): string {
  if (!value) {
    return "";
  }

  return Array.isArray(value) ? value.join(", ") : value;
}

export default function TemplateSectionStep({
  selectedToolId,
  selectedFileSubtypeIndex,
  selectedType,
  entityName,
  entityDescription,
  values,
  onValuesChange,
  section,
  translationNamespace
}: TemplateSectionStepProps) {
  const t = useTranslations(translationNamespace);
  const tAll = useTranslations();
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const schema = useMemo(() => {
    const service = createTemplateFormSchemaService((key) => (tAll.has(key) ? tAll(key) : undefined));

    return service.buildForm(
      selectedToolId,
      selectedType,
      section,
      entityName,
      entityDescription,
      selectedFileSubtypeIndex
    );
  }, [entityDescription, entityName, section, selectedFileSubtypeIndex, selectedToolId, selectedType, tAll]);

  const fields = schema.section.fields;

  const onFieldChange = (field: FormField, value: string | string[]) => {
    onValuesChange({
      ...values,
      [field.name]: value
    });
  };

  const addListItem = (field: FormField) => {
    const currentItems = ensureArrayValue(values[field.name]);
    const draftValue = drafts[field.name]?.trim();

    if (!draftValue) {
      return;
    }

    onFieldChange(field, [...currentItems, draftValue]);
    setDrafts((previous) => ({ ...previous, [field.name]: "" }));
  };

  const removeListItem = (field: FormField, index: number) => {
    const currentItems = ensureArrayValue(values[field.name]);
    const nextItems = currentItems.filter((_, itemIndex) => itemIndex !== index);
    onFieldChange(field, nextItems);
  };

  const renderHint = (field: FormField) => {
    if (!field.hint) {
      return null;
    }

    return (
      <div className="mt-4 rounded-lg border border-black/10 bg-gray-100 p-4 text-left dark:border-white/15 dark:bg-background">
        <p className="text-sm text-foreground/80">{field.hint}</p>
      </div>
    );
  };

  const renderField = (field: FormField) => {
    const fieldValue = values[field.name] ?? field.value;
    const baseClass = field.required
      ? "w-full rounded-lg border border-black/30 bg-transparent px-3 py-2 text-base text-foreground outline-none focus-visible:ring-2 focus-visible:ring-foreground dark:border-white/35"
      : "w-full rounded-lg border border-black/20 bg-transparent px-3 py-2 text-base text-foreground outline-none focus-visible:ring-2 focus-visible:ring-foreground/50 dark:border-white/25";

    if (field.inputType === "input-single-line") {
      return (
        <div key={field.id} className="flex flex-col gap-2">
          <label htmlFor={field.id} className="text-sm font-medium text-foreground">
            {field.label}
          </label>
          <input
            id={field.id}
            type="text"
            value={ensureStringValue(fieldValue)}
            onChange={(event) => onFieldChange(field, event.target.value)}
            placeholder={field.label}
            className={baseClass}
            aria-required={field.required}
          />
          {renderHint(field)}
        </div>
      );
    }

    if (field.inputType === "textarea") {
      return (
        <div key={field.id} className="flex flex-col gap-2">
          <label htmlFor={field.id} className="text-sm font-medium text-foreground">
            {field.label}
          </label>
          <textarea
            id={field.id}
            value={ensureStringValue(fieldValue)}
            onChange={(event) => onFieldChange(field, event.target.value)}
            placeholder={field.label}
            rows={3}
            className={baseClass}
            aria-required={field.required}
          />
          {renderHint(field)}
        </div>
      );
    }

    const listItems = ensureArrayValue(fieldValue);

    return (
      <div key={field.id} className="flex flex-col gap-2">
        <label htmlFor={`${field.id}-input`} className="text-sm font-medium text-foreground">
          {field.label}
        </label>

        <div className="flex gap-2">
          <input
            id={`${field.id}-input`}
            type="text"
            value={drafts[field.name] ?? ""}
            onChange={(event) => setDrafts((previous) => ({ ...previous, [field.name]: event.target.value }))}
            placeholder={t("itemPlaceholder")}
            className={baseClass}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addListItem(field);
              }
            }}
          />
          <button
            type="button"
            onClick={() => addListItem(field)}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-black/20 px-4 text-sm font-semibold text-foreground transition-opacity hover:opacity-80 dark:border-white/25"
          >
            {t("addItem")}
          </button>
        </div>

        {listItems.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {listItems.map((item, index) => (
              <span
                key={`${field.id}-${item}-${index}`}
                className="inline-flex items-center gap-2 rounded-full border border-black/20 px-3 py-1 text-sm text-foreground dark:border-white/25"
              >
                {item}
                <button
                  type="button"
                  onClick={() => removeListItem(field, index)}
                  aria-label={t("removeItem")}
                  className="font-bold leading-none"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : null}
        {renderHint(field)}
      </div>
    );
  };

  return (
    <>
      <h2 className="text-2xl font-semibold text-foreground">{t("phaseTitle")}</h2>
      <p className="mt-2 text-base text-foreground/80">{t("phaseDescription")}</p>

      <div className="mt-6">
        <p className="text-xl font-semibold text-foreground">{t("sectionTitle")}</p>
      </div>

      <div className="mt-4 flex flex-col gap-5 text-left">
        {fields.length === 0 ? (
          <p className="text-sm text-foreground/80">{schema.meta.message ?? t("emptySection")}</p>
        ) : (
          fields.map(renderField)
        )}
      </div>
    </>
  );
}
