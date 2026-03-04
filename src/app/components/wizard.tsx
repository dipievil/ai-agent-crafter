import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import aiToolsData from "@/data/ai-tools.json";
import type { AiToolData, AiToolOption, FileType } from "@/types/wizard/common";
import NavbarWizard from "./wizard/navbar-wizard";

import { StepsWizardProps } from "./wizard.types";
import AiTypeStep from "./wizard/steps/ai-type-step";
import FileTypeStep from "./wizard/steps/file-type-step";
import EntityNameStep from "./wizard/steps/entity-name-step";
import EntityDescriptionStep from "./wizard/steps/entity-description-step";
import TemplateHeaderStep from "./wizard/steps/template-header-step";
import TemplateBodyStep from "./wizard/steps/template-body-step";
import ReviewStep from "./wizard/steps/review-step";
import SummarySection from "./wizard/summary-wizard";
import type { FileNameCustomField, FileSubtypeOption } from "./wizard/steps/ai-type-step.types";

import {
  clearSelections,
  persistSelections,
  readStoredSelections
} from "@/features/wizard/infra/wizard.storage.service";
import { buildTemplateForm } from "@/features/wizard/infra/wizard.form-schema.service";
import { buildTemplateMarkdown } from "@/features/wizard/infra/wizard.markdown-builder.service";
import { normalizeFieldName } from "@/features/template-data.shared";

type FileNodeRaw = Record<string, unknown>;

type FileNameCustomRaw = {
  name?: unknown;
  hint?: unknown;
  type?: unknown;
  required?: unknown;
  defaultName?: unknown;
};

function getFilesNode(toolId: string): Record<string, unknown> | undefined {
  const toolNode = (aiToolsData as Record<string, unknown>)[toolId];

  if (!toolNode || typeof toolNode !== "object") {
    return undefined;
  }

  const files = (toolNode as { files?: Record<string, unknown> }).files;
  if (!files || typeof files !== "object") {
    return undefined;
  }

  return files;
}

function toolSupportsFileType(toolId: string, fileType: FileType): boolean {
  const files = getFilesNode(toolId);

  if (!files) {
    return false;
  }

  return Object.prototype.hasOwnProperty.call(files, fileType);
}

function getFileNodes(toolId: string, fileType: FileType): FileNodeRaw[] {
  const files = getFilesNode(toolId);

  if (!files) {
    return [];
  }

  const fileNode = files[fileType];

  const fileNodes = Array.isArray(fileNode) ? fileNode : typeof fileNode === "object" ? [fileNode] : [];

  return fileNodes.filter((node): node is FileNodeRaw => Boolean(node) && typeof node === "object");
}

function getSelectedFileNode(toolId: string, fileType: FileType, fileSubtypeIndex: number): FileNodeRaw | undefined {
  const fileNodes = getFileNodes(toolId, fileType);
  return fileNodes[fileSubtypeIndex];
}

function getOutputFileTemplate(toolId: string, fileType: FileType, fileSubtypeIndex: number): string {
  const selectedNode = getSelectedFileNode(toolId, fileType, fileSubtypeIndex);
  if (!selectedNode) {
    return "";
  }

  const outputFile = selectedNode["output-file"];
  if (typeof outputFile === "string") {
    return outputFile;
  }

  if (Array.isArray(outputFile)) {
    const firstOutputFile = outputFile.find((value): value is string => typeof value === "string");
    return firstOutputFile ?? "";
  }

  return "";
}

function normalizeCustomToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9_-]/g, "");
}

function getFileNameCustomField(toolId: string, fileType: FileType, fileSubtypeIndex: number): FileNameCustomField | undefined {
  const selectedNode = getSelectedFileNode(toolId, fileType, fileSubtypeIndex);
  if (!selectedNode) {
    return undefined;
  }

  const customNode = selectedNode["custom"];
  const customFields = Array.isArray(customNode)
    ? customNode
    : typeof customNode === "object" && customNode
      ? [customNode]
      : [];

  const firstCustom = customFields.find((field): field is FileNameCustomRaw => Boolean(field) && typeof field === "object");

  if (!firstCustom || typeof firstCustom.name !== "string" || firstCustom.name.trim().length === 0) {
    return undefined;
  }

  return {
    label: firstCustom.name.trim(),
    hint: typeof firstCustom.hint === "string" ? firstCustom.hint : undefined,
    required: firstCustom.required !== false,
    type: typeof firstCustom.type === "string" ? firstCustom.type : undefined,
    defaultName: typeof firstCustom.defaultName === "string" ? firstCustom.defaultName : ""
  };
}

function getFileNameCustomFieldTranslationKey(
  toolId: string,
  fileType: FileType,
  rawFieldName: string,
  leaf: "label" | "hint"
): string {
  return `templates.${toolId}.${fileType}.custom.${normalizeFieldName(rawFieldName)}.${leaf}`;
}

function getTranslatedFileNameCustomField(
  toolId: string,
  fileType: FileType,
  fileSubtypeIndex: number,
  resolveTranslation?: (key: string) => string | undefined
): FileNameCustomField | undefined {
  const customField = getFileNameCustomField(toolId, fileType, fileSubtypeIndex);

  if (!customField || !resolveTranslation) {
    return customField;
  }

  const labelKey = getFileNameCustomFieldTranslationKey(toolId, fileType, customField.label, "label");
  const hintKey = getFileNameCustomFieldTranslationKey(toolId, fileType, customField.label, "hint");

  const translatedLabel = resolveTranslation(labelKey);
  const translatedHint = resolveTranslation(hintKey);

  return {
    ...customField,
    label: translatedLabel ?? customField.label,
    hint: translatedHint ?? customField.hint
  };
}

function resolveOutputFileName(
  outputFileTemplate: string,
  customField: FileNameCustomField | undefined,
  customValue: string,
  entityName: string
): string {
  if (!outputFileTemplate) {
    return "";
  }

  if (!customField) {
    return outputFileTemplate;
  }

  const value = resolveDynamicFileNameValue(customValue, customField, entityName);
  const customToken = normalizeCustomToken(customField.label);
  const customTypeToken = customField.type ? normalizeCustomToken(customField.type) : "";
  let isTokenReplaced = false;

  const resolvedFileName = outputFileTemplate.replace(/\{([^}]+)\}/g, (rawValue, tokenValue: string) => {
    const normalizedToken = normalizeCustomToken(tokenValue);
    if (normalizedToken === customToken || (customTypeToken && normalizedToken === customTypeToken)) {
      isTokenReplaced = true;
      return value;
    }

    return rawValue;
  });

  if (customField.type === "filenameprefix" && value && !isTokenReplaced) {
    return `${value}.${resolvedFileName}`;
  }

  return resolvedFileName;
}

function resolveDefaultDynamicFileName(defaultName: string, entityName: string): string {
  const normalizedDefaultName = normalizeCustomToken(defaultName);

  if (normalizedDefaultName === "entityname") {
    return entityName.trim();
  }

  return defaultName.trim();
}

function resolveDynamicFileNameValue(
  customValue: string,
  customField: FileNameCustomField | undefined,
  entityName: string
): string {
  if (!customField) {
    return customValue.trim();
  }

  const trimmedValue = customValue.trim();
  if (!trimmedValue) {
    return resolveDefaultDynamicFileName(customField.defaultName, entityName);
  }

  const normalizedDefaultName = normalizeCustomToken(customField.defaultName);
  const normalizedCustomValue = normalizeCustomToken(trimmedValue);

  if (normalizedDefaultName === "entityname" && normalizedCustomValue === "entityname") {
    return entityName.trim();
  }

  return trimmedValue;
}

function getDefaultDynamicFileNameValue(
  toolId: string,
  fileType: FileType,
  fileSubtypeIndex: number,
  entityName: string
): string {
  const defaultName = getFileNameCustomField(toolId, fileType, fileSubtypeIndex)?.defaultName ?? "";
  return resolveDefaultDynamicFileName(defaultName, entityName);
}


function getFileSubtypeOptions(toolId: string, fileType: FileType): FileSubtypeOption[] {
  const fileNodes = getFileNodes(toolId, fileType);

  return fileNodes
    .map((node, index) => {
      if (!node || typeof node !== "object") {
        return undefined;
      }

      const name = (node as { name?: unknown; title?: unknown }).name;
      const title = (node as { title?: unknown }).title;
      const labelSource = typeof name === "string" ? name : typeof title === "string" ? title : undefined;

      return {
        index,
        label: labelSource?.trim() || `Subtype ${index + 1}`
      };
    })
    .filter((item): item is FileSubtypeOption => Boolean(item));
}

function getHint(toolId: string, fileType: FileType, fileSubtypeIndex: number): string | undefined {
  const subtypeNode = getSelectedFileNode(toolId, fileType, fileSubtypeIndex);
  if (!subtypeNode || typeof subtypeNode !== "object") {
    return undefined;
  }

  const hint = (subtypeNode as { hint?: unknown }).hint;
  return typeof hint === "string" ? hint : undefined;
}


export default function StepsWizard({
  fileOptions: options
}: StepsWizardProps) {
  const defaultType = options[0]?.value ?? "agent-instructions";

  const tData = useTranslations("aiApps");
  const tAll = useTranslations();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7>(1);

  const aiTools = Object.entries(aiToolsData).map(([id, tool]) => {

    const item = tool as AiToolData;
    const match = item.description.match(/^\{(.+)\}$/);
    const descriptionKey = match?.[1];
    const description =
      descriptionKey && tData.has(descriptionKey)
        ? tData(descriptionKey)
        : item.description;

    const aiToolOption: AiToolOption = {
      id,
      name: item.name,
      description,
      url: item.url
    };
    return aiToolOption;
  });

  const defaultToolId = "";
  const defaultFileSubtypeIndex = 0;
  const defaultDynamicFileNameValue = "";
  const defaultEntityName = "";
  const defaultOutputFileName = "";
  const defaultDescription = "";
  const defaultHeaderFormValues: Record<string, string | string[]> = {};
  const defaultBodyFormValues: Record<string, string | string[]> = {};

  const storedSelections = readStoredSelections(
    defaultType,
    defaultToolId,
    defaultFileSubtypeIndex,
    defaultDynamicFileNameValue,
    defaultEntityName,
    defaultOutputFileName,
    defaultDescription,
    defaultHeaderFormValues,
    defaultBodyFormValues,
    aiTools
  );

  const [selectedType, setSelectedType] = useState<FileType>(storedSelections.fileType);

  const [selectedToolId, setSelectedToolId] = useState<string>(storedSelections.toolId);
  const [selectedFileSubtypeIndex, setSelectedFileSubtypeIndex] = useState<number>(storedSelections.fileSubtypeIndex);
  const [dynamicFileNameValue, setDynamicFileNameValue] = useState<string>(storedSelections.dynamicFileNameValue);
  const [entityName, setEntityName] = useState<string>(storedSelections.entityName);
  const [description, setDescription] = useState<string>(storedSelections.description);
  const [headerFormValues, setHeaderFormValues] = useState<Record<string, string | string[]>>(
    storedSelections.headerFormValues
  );
  const [bodyFormValues, setBodyFormValues] = useState<Record<string, string | string[]>>(
    storedSelections.bodyFormValues
  );

  const filteredAiTools = useMemo(
    () =>
      aiTools
        .filter((tool) => toolSupportsFileType(tool.id, selectedType))
        .sort((left, right) => left.name.localeCompare(right.name, "pt-BR", { sensitivity: "base" })),
    [aiTools, selectedType]
  );

  const effectiveSelectedToolId = useMemo(() => {
    const hasSelectedTool = filteredAiTools.some((tool) => tool.id === selectedToolId);
    return hasSelectedTool ? selectedToolId : "";
  }, [filteredAiTools, selectedToolId]);

  const fileSubtypeOptions = useMemo(
    () => getFileSubtypeOptions(effectiveSelectedToolId, selectedType),
    [effectiveSelectedToolId, selectedType]
  );

  const effectiveFileSubtypeIndex = useMemo(() => {
    if (fileSubtypeOptions.length === 0) {
      return 0;
    }

    const isValidSelection = fileSubtypeOptions.some((option) => option.index === selectedFileSubtypeIndex);
    return isValidSelection ? selectedFileSubtypeIndex : fileSubtypeOptions[0].index;
  }, [fileSubtypeOptions, selectedFileSubtypeIndex]);

  const selectedFileSubtypeLabel = useMemo(() => {
    if (fileSubtypeOptions.length <= 1) {
      return undefined;
    }

    return fileSubtypeOptions.find((option) => option.index === effectiveFileSubtypeIndex)?.label;
  }, [effectiveFileSubtypeIndex, fileSubtypeOptions]);

  const customFileNameField = useMemo(
    () =>
      getTranslatedFileNameCustomField(
        effectiveSelectedToolId,
        selectedType,
        effectiveFileSubtypeIndex,
        (key) => (tAll.has(key) ? tAll(key) : undefined)
      ),
    [effectiveFileSubtypeIndex, effectiveSelectedToolId, selectedType, tAll]
  );

  const outputFileTemplate = useMemo(
    () => getOutputFileTemplate(effectiveSelectedToolId, selectedType, effectiveFileSubtypeIndex),
    [effectiveFileSubtypeIndex, effectiveSelectedToolId, selectedType]
  );

  const resolvedCustomFileNameValue = useMemo(
    () => resolveDynamicFileNameValue(dynamicFileNameValue, customFileNameField, entityName),
    [customFileNameField, dynamicFileNameValue, entityName]
  );

  const outputFileName = useMemo(
    () => resolveOutputFileName(outputFileTemplate, customFileNameField, dynamicFileNameValue, entityName),
    [customFileNameField, dynamicFileNameValue, entityName, outputFileTemplate]
  );

  const isDownloadReady = useMemo(() => {
    if (!outputFileName) {
      return false;
    }

    if (!customFileNameField || !customFileNameField.required) {
      return true;
    }

    return resolvedCustomFileNameValue.length > 0;
  }, [customFileNameField, outputFileName, resolvedCustomFileNameValue]);

  const fileHint = useMemo(
    () => getHint(effectiveSelectedToolId, selectedType, effectiveFileSubtypeIndex),
    [effectiveFileSubtypeIndex, effectiveSelectedToolId, selectedType]
  );

  const hasHeaderFields = useMemo(() => {
    if (!effectiveSelectedToolId) {
      return false;
    }

    const result = buildTemplateForm(
      effectiveSelectedToolId,
      selectedType,
      "header",
      entityName,
      description,
      effectiveFileSubtypeIndex
    );

    return result.section.fields.length > 0;
  }, [description, effectiveFileSubtypeIndex, effectiveSelectedToolId, entityName, selectedType]);

  const markdownBuildResult = useMemo(() => {
    if (!effectiveSelectedToolId) {
      return {
        output: {
          markdown: "",
          header: "",
          body: ""
        },
        warnings: []
      };
    }

    return buildTemplateMarkdown({
      aitype: effectiveSelectedToolId,
      filetype: selectedType,
      entityName,
      entityDescription: description,
      headerFormValues,
      bodyFormValues,
      fileSubtypeIndex: effectiveFileSubtypeIndex
    });
  }, [
    bodyFormValues,
    description,
    effectiveFileSubtypeIndex,
    effectiveSelectedToolId,
    entityName,
    headerFormValues,
    selectedType
  ]);

  function handleTypeChange(fileType: FileType) {
    setSelectedType(fileType);
    setSelectedToolId(defaultToolId);
    setSelectedFileSubtypeIndex(defaultFileSubtypeIndex);
    setDynamicFileNameValue(defaultDynamicFileNameValue);
  }

  function handleToolChange(toolId: string) {
    const nextSubtypeIndex = 0;

    setSelectedToolId(toolId);
    setSelectedFileSubtypeIndex(nextSubtypeIndex);
    setDynamicFileNameValue(getDefaultDynamicFileNameValue(toolId, selectedType, nextSubtypeIndex, entityName));
  }

  function handleFileSubtypeChange(subtypeIndex: number) {
    setSelectedFileSubtypeIndex(subtypeIndex);
    setDynamicFileNameValue(getDefaultDynamicFileNameValue(effectiveSelectedToolId, selectedType, subtypeIndex, entityName));
  }

  function handleDownloadFile() {
    if (typeof window === "undefined") {
      return;
    }

    if (!outputFileName) {
      return;
    }

    const markdown = markdownBuildResult.output.markdown;
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const anchor = window.document.createElement("a");
    anchor.href = url;
    anchor.download = outputFileName;
    window.document.body.appendChild(anchor);
    anchor.click();
    window.document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);
  }

  useEffect(() => {
    persistSelections(
      selectedType,
      effectiveSelectedToolId,
      effectiveFileSubtypeIndex,
      dynamicFileNameValue,
      entityName,
      outputFileName,
      description,
      headerFormValues,
      bodyFormValues
    );
  }, [
    selectedType,
    effectiveSelectedToolId,
    effectiveFileSubtypeIndex,
    dynamicFileNameValue,
    entityName,
    outputFileName,
    description,
    headerFormValues,
    bodyFormValues
  ]);

  function handleBackToPhaseOne() {
    clearSelections();
    setSelectedType(defaultType);
    setSelectedToolId(defaultToolId);
    setSelectedFileSubtypeIndex(defaultFileSubtypeIndex);
    setDynamicFileNameValue(defaultDynamicFileNameValue);
    setEntityName(defaultEntityName);
    setDescription(defaultDescription);
    setHeaderFormValues(defaultHeaderFormValues);
    setBodyFormValues(defaultBodyFormValues);
    setStep(1);
  }

  switch (step) {
    default: case 1:
      return (
        <section className="w-full max-w-none items-center rounded-2xl border border-black/10 bg-background p-6 shadow-sm dark:border-white/15">
          <FileTypeStep
            selectedType={selectedType}
            fileOptions={options}
            onTypeChange={handleTypeChange}
          />
          <NavbarWizard
            currentStep={1}
            selectedType={selectedType}
            onForward={() => setStep(2)}
            onBack={handleBackToPhaseOne} />
        </section>
      );
    case 2:
      return (
        <section className="w-full max-w-none items-center rounded-2xl border border-black/10 bg-background p-6 shadow-sm dark:border-white/15">
          <SummarySection
            currentStep={2}
            aiTools={filteredAiTools}
            selectedToolId={effectiveSelectedToolId}
            selectedFileSubtypeLabel={selectedFileSubtypeLabel}
            selectedType={selectedType} />
          <AiTypeStep
            selectedToolId={effectiveSelectedToolId}
            aiTools={filteredAiTools}
            selectedFileSubtypeIndex={effectiveFileSubtypeIndex}
            fileSubtypeOptions={fileSubtypeOptions}
            fileHint={fileHint}
            onToolChange={handleToolChange}
            onFileSubtypeChange={handleFileSubtypeChange}
          />
          <NavbarWizard
            currentStep={2}
            selectedType={selectedType}
            onForward={effectiveSelectedToolId ? () => setStep(3) : undefined}
            onBack={() => setStep(1)} />
        </section>
      );
    case 3:
      return (
        <section className="w-full max-w-none items-center rounded-2xl border border-black/10 bg-background p-6 shadow-sm dark:border-white/15">
          <SummarySection
            currentStep={3}
            aiTools={filteredAiTools}
            selectedToolId={selectedToolId}
            selectedFileSubtypeLabel={selectedFileSubtypeLabel}
            selectedType={selectedType} />
          <EntityNameStep
            selectedType={selectedType}
            entityName={entityName}
            onEntityNameChange={setEntityName}
          />
          <NavbarWizard
            currentStep={3}
            selectedType={selectedType}
            onForward={() => setStep(4)}
            onBack={() => setStep(2)}
            onCancel={handleBackToPhaseOne}
          />
        </section>
      );
    case 4:
      return (
        <section className="w-full max-w-none items-center rounded-2xl border border-black/10 bg-background p-6 shadow-sm dark:border-white/15">
          <SummarySection
            currentStep={4}
            aiTools={filteredAiTools}
            selectedToolId={effectiveSelectedToolId}
            selectedFileSubtypeLabel={selectedFileSubtypeLabel}
            selectedType={selectedType}
            entityName={entityName}
          />
          <EntityDescriptionStep
            selectedType={selectedType}
            description={description}
            onDescriptionChange={setDescription}
          />
          <NavbarWizard
            currentStep={4}
            selectedType={selectedType}
            onForward={() => setStep(hasHeaderFields ? 5 : 6)}
            onBack={() => setStep(3)}
            onCancel={handleBackToPhaseOne}
          />
        </section>
      );
    case 5:
      return (
        <section className="w-full max-w-none items-center rounded-2xl border border-black/10 bg-background p-6 shadow-sm dark:border-white/15">
          <SummarySection
            currentStep={5}
            aiTools={filteredAiTools}
            selectedToolId={effectiveSelectedToolId}
            selectedFileSubtypeLabel={selectedFileSubtypeLabel}
            selectedType={selectedType}
            entityName={entityName}
          />

          <TemplateHeaderStep
            selectedToolId={effectiveSelectedToolId}
            selectedFileSubtypeIndex={effectiveFileSubtypeIndex}
            selectedType={selectedType}
            entityName={entityName}
            entityDescription={description}
            values={headerFormValues}
            onValuesChange={setHeaderFormValues}
          />

          <NavbarWizard
            currentStep={5}
            selectedType={selectedType}
            onForward={() => setStep(6)}
            onBack={() => setStep(4)}
            onCancel={handleBackToPhaseOne}
          />
        </section>
      );
    case 6:
      return (
        <section className="w-full max-w-none items-center rounded-2xl border border-black/10 bg-background p-6 shadow-sm dark:border-white/15">
          <SummarySection
            currentStep={6}
            aiTools={filteredAiTools}
            selectedToolId={effectiveSelectedToolId}
            selectedFileSubtypeLabel={selectedFileSubtypeLabel}
            selectedType={selectedType}
            entityName={entityName}
          />

          <TemplateBodyStep
            selectedToolId={effectiveSelectedToolId}
            selectedFileSubtypeIndex={effectiveFileSubtypeIndex}
            selectedType={selectedType}
            entityName={entityName}
            entityDescription={description}
            values={bodyFormValues}
            onValuesChange={setBodyFormValues}
          />

          <NavbarWizard
            currentStep={6}
            selectedType={selectedType}
            onForward={() => setStep(7)}
            onBack={() => setStep(5)}
            onCancel={handleBackToPhaseOne}
          />
        </section>
      );
    case 7:
      return (
        <section className="w-full max-w-none items-center rounded-2xl border border-black/10 bg-background p-6 shadow-sm dark:border-white/15">
          <SummarySection
            currentStep={7}
            aiTools={filteredAiTools}
            selectedToolId={effectiveSelectedToolId}
            selectedFileSubtypeLabel={selectedFileSubtypeLabel}
            selectedType={selectedType}
            entityName={entityName}
          />

          <ReviewStep
            markdown={markdownBuildResult.output.markdown}
            customFileNameField={customFileNameField}
            customFileNameValue={resolvedCustomFileNameValue}
            outputFileNamePreview={outputFileName}
            onCustomFileNameValueChange={setDynamicFileNameValue}
          />

          <NavbarWizard
            currentStep={7}
            selectedType={selectedType}
            onForward={isDownloadReady ? handleDownloadFile : undefined}
            onBack={() => setStep(6)}
            onCancel={handleBackToPhaseOne}
          />
        </section>
      );
  }
}
