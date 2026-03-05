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
import type { FileNameSegmentField, FileSubtypeOption } from "./wizard/steps/ai-type-step.types";

import {
  clearSelections,
  persistSelections,
  readStoredSelections
} from "@/features/wizard/infra/wizard.storage.service";
import { buildTemplateForm } from "@/features/wizard/infra/wizard.form-schema.service";
import { buildTemplateMarkdown } from "@/features/wizard/infra/wizard.markdown-builder.service";
import { normalizeFieldName, normalizeLettersOnly } from "@/features/template-data.shared";

type FileNodeRaw = Record<string, unknown>;

type FileNameSegmentRaw = {
  name?: unknown;
  hint?: unknown;
  required?: unknown;
  defaultValue?: unknown;
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

function normalizeFilenameToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9_-]/g, "");
}

function getFileNameSegments(toolId: string, fileType: FileType, fileSubtypeIndex: number): FileNameSegmentField[] {
  const selectedNode = getSelectedFileNode(toolId, fileType, fileSubtypeIndex);
  if (!selectedNode) {
    return [];
  }

  const rawSegments = selectedNode["filename-segments"];
  const segments = Array.isArray(rawSegments)
    ? rawSegments
    : typeof rawSegments === "object" && rawSegments
      ? [rawSegments]
      : [];

  return segments
    .filter((segment): segment is FileNameSegmentRaw => Boolean(segment) && typeof segment === "object")
    .map((segment) => {
      const name = typeof segment.name === "string" ? segment.name.trim() : "";
      if (!name) {
        return undefined;
      }

      return {
        key: normalizeFieldName(name),
        name,
        hint: typeof segment.hint === "string" ? segment.hint : undefined,
        required: segment.required === true,
        defaultValue: typeof segment.defaultValue === "string" ? segment.defaultValue : undefined
      };
    })
    .filter((segment): segment is FileNameSegmentField => Boolean(segment));
}

function getFileNameSegmentTranslationKey(
  toolId: string,
  fileType: FileType,
  rawFieldName: string,
  leaf: "label" | "hint"
): string {
  return `templates.${toolId}.${fileType}.filename-segments.${normalizeFieldName(rawFieldName)}.${leaf}`;
}

function getTranslatedFileNameSegments(
  toolId: string,
  fileType: FileType,
  fileSubtypeIndex: number,
  resolveTranslation?: (key: string) => string | undefined
): FileNameSegmentField[] {
  const segments = getFileNameSegments(toolId, fileType, fileSubtypeIndex);

  if (!resolveTranslation) {
    return segments;
  }

  return segments.map((segment) => {
    const labelKey = getFileNameSegmentTranslationKey(toolId, fileType, segment.name, "label");
    const hintKey = getFileNameSegmentTranslationKey(toolId, fileType, segment.name, "hint");

    const translatedLabel = resolveTranslation(labelKey);
    const translatedHint = resolveTranslation(hintKey);

    return {
      ...segment,
      name: translatedLabel ?? segment.name,
      hint: translatedHint ?? segment.hint
    };
  });
}

function resolveOutputFileName(
  outputFileTemplate: string,
  segments: FileNameSegmentField[],
  segmentEffectiveValues: Record<string, string>
): string {
  if (!outputFileTemplate) {
    return "";
  }

  if (segments.length === 0) {
    return outputFileTemplate;
  }

  return outputFileTemplate.replace(/\{([^}]+)\}/g, (rawValue, tokenValue: string) => {
    const normalizedToken = normalizeFilenameToken(tokenValue);
    const segment = segments.find((item) => normalizeFilenameToken(item.name) === normalizedToken);

    if (!segment) {
      return rawValue;
    }

    return (segmentEffectiveValues[segment.key] ?? "").trim();
  });
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
  const defaultFilenameSegmentValues: Record<string, string> = {};
  const defaultEntityName = "";
  const defaultOutputFileName = "";
  const defaultDescription = "";
  const defaultHeaderFormValues: Record<string, string | string[]> = {};
  const defaultBodyFormValues: Record<string, string | string[]> = {};

  const storedSelections = readStoredSelections(
    defaultType,
    defaultToolId,
    defaultFileSubtypeIndex,
    defaultFilenameSegmentValues,
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
  const [filenameSegmentValues, setFilenameSegmentValues] = useState<Record<string, string>>(
    storedSelections.filenameSegmentValues
  );
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

  const filenameSegments = useMemo(
    () =>
      getTranslatedFileNameSegments(
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

  const filenameSegmentDefaultValues = useMemo(() => {
    if (!effectiveSelectedToolId || filenameSegments.length === 0) {
      return {} as Record<string, string>;
    }

    const resolvedFieldValues = new Map<string, string>();

    const header = buildTemplateForm(
      effectiveSelectedToolId,
      selectedType,
      "header",
      entityName,
      description,
      effectiveFileSubtypeIndex
    );

    const body = buildTemplateForm(
      effectiveSelectedToolId,
      selectedType,
      "body",
      entityName,
      description,
      effectiveFileSubtypeIndex
    );

    const allFields = [...header.section.fields, ...body.section.fields];

    allFields.forEach((field) => {
      const rawValue = field.section === "header" ? headerFormValues[field.name] : bodyFormValues[field.name];
      const resolvedValue =
        typeof rawValue === "string"
          ? rawValue
          : Array.isArray(rawValue)
            ? rawValue.join("")
            : (field.value ?? "");

      const normalizedName = normalizeFieldName(field.name);
      const normalizedSourceName = normalizeFieldName(field.sourceName ?? field.name);

      resolvedFieldValues.set(normalizedName, resolvedValue);
      resolvedFieldValues.set(normalizedSourceName, resolvedValue);
    });

    return Object.fromEntries(
      filenameSegments.map((segment) => {
        const defaultValueReference = (segment.defaultValue ?? "").trim();
        const normalizedReference = normalizeFieldName(defaultValueReference);
        const templateFieldValue = resolvedFieldValues.get(normalizedReference);

        if (!defaultValueReference) {
          return [segment.key, entityName.trim()];
        }

        if (normalizedReference === "entityname") {
          return [segment.key, normalizeLettersOnly(entityName)];
        }

        if (templateFieldValue !== undefined) {
          return [segment.key, normalizeLettersOnly(templateFieldValue)];
        }

        return [segment.key, defaultValueReference];
      })
    );
  }, [
    bodyFormValues,
    description,
    effectiveFileSubtypeIndex,
    effectiveSelectedToolId,
    entityName,
    filenameSegments,
    headerFormValues,
    selectedType
  ]);

  const filenameSegmentEffectiveValues = useMemo(
    () =>
      Object.fromEntries(
        filenameSegments.map((segment) => {
          const typedValue = (filenameSegmentValues[segment.key] ?? "").trim();
          const defaultValue = (filenameSegmentDefaultValues[segment.key] ?? "").trim();

          return [segment.key, typedValue.length > 0 ? typedValue : defaultValue];
        })
      ),
    [filenameSegmentDefaultValues, filenameSegmentValues, filenameSegments]
  );

  const outputFileName = useMemo(
    () =>
      resolveOutputFileName(
        outputFileTemplate,
        filenameSegments,
        filenameSegmentEffectiveValues
      ),
    [filenameSegmentEffectiveValues, filenameSegments, outputFileTemplate]
  );

  const isDownloadReady = useMemo(() => {
    if (!outputFileName) {
      return false;
    }

    const hasEmptyRequiredSegment = filenameSegments.some(
      (segment) => segment.required && (filenameSegmentEffectiveValues[segment.key] ?? "").trim().length === 0
    );

    return !hasEmptyRequiredSegment;
  }, [filenameSegmentEffectiveValues, filenameSegments, outputFileName]);

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
    setFilenameSegmentValues(defaultFilenameSegmentValues);
  }

  function handleToolChange(toolId: string) {
    const nextSubtypeIndex = 0;

    setSelectedToolId(toolId);
    setSelectedFileSubtypeIndex(nextSubtypeIndex);
    setFilenameSegmentValues(defaultFilenameSegmentValues);
  }

  function handleFileSubtypeChange(subtypeIndex: number) {
    setSelectedFileSubtypeIndex(subtypeIndex);
    setFilenameSegmentValues(defaultFilenameSegmentValues);
  }

  function handleFilenameSegmentValueChange(segmentKey: string, value: string) {
    setFilenameSegmentValues((currentValues) => ({
      ...currentValues,
      [segmentKey]: value
    }));
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
      filenameSegmentValues,
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
    filenameSegmentValues,
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
    setFilenameSegmentValues(defaultFilenameSegmentValues);
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
            filenameSegments={filenameSegments}
            filenameSegmentValues={filenameSegmentEffectiveValues}
            outputFileNamePreview={outputFileName}
            onFilenameSegmentValueChange={handleFilenameSegmentValueChange}
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
