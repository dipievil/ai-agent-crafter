import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import aiToolsData from "@/data/ai-tools.json";
import type { AiToolData, AiToolOption, FileType } from "@/types/wizard/common";
import NavbarWizard from "./navbar-wizard";

import { StepsWizardProps } from "./wizard.types";
import AiTypeStep from "./wizard/ai-type-step";
import FileTypeStep from "./wizard/file-type-step";
import EntityNameStep from "./wizard/entity-name-step";
import EntityDescriptionStep from "./wizard/entity-description-step";
import TemplateHeaderStep from "./wizard/template-header-step";
import TemplateBodyStep from "./wizard/template-body-step";
import SummarySection from "./summary-wizard";
import type { FileSubtypeOption } from "./wizard/ai-type-step.types";

import {
  clearSelections,
  persistSelections,
  readStoredSelections
} from "@/features/wizard/infra/wizard.storage.service";
import { buildTemplateForm } from "@/features/wizard/infra/wizard.form-schema.service";

function toolSupportsFileType(toolId: string, fileType: FileType): boolean {
  const toolNode = (aiToolsData as Record<string, unknown>)[toolId];

  if (!toolNode || typeof toolNode !== "object") {
    return false;
  }

  const files = (toolNode as { files?: Record<string, unknown> }).files;
  if (!files || typeof files !== "object") {
    return false;
  }

  return Object.prototype.hasOwnProperty.call(files, fileType);
}

function getFileSubtypeOptions(toolId: string, fileType: FileType): FileSubtypeOption[] {
  const toolNode = (aiToolsData as Record<string, unknown>)[toolId];

  if (!toolNode || typeof toolNode !== "object") {
    return [];
  }

  const files = (toolNode as { files?: Record<string, unknown> }).files;
  if (!files || typeof files !== "object") {
    return [];
  }

  const fileNode = files[fileType];

  if (!Array.isArray(fileNode)) {
    return [];
  }

  return fileNode
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


export default function StepsWizard({
  fileOptions: options
}: StepsWizardProps) {
  const defaultType = options[0]?.value ?? "agent-instructions";

  const tData = useTranslations("aiApps");
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);

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

  const defaultToolId = aiTools[0]?.id ?? "";
  const defaultFileSubtypeIndex = 0;
  const defaultFileName = "";
  const defaultDescription = "";
  const defaultHeaderFormValues: Record<string, string | string[]> = {};
  const defaultBodyFormValues: Record<string, string | string[]> = {};

  const storedSelections = readStoredSelections(
    defaultType,
    defaultToolId,
    defaultFileSubtypeIndex,
    defaultFileName,
    defaultDescription,
    defaultHeaderFormValues,
    defaultBodyFormValues,
    aiTools
  );

  const [selectedType, setSelectedType] = useState<FileType>(storedSelections.fileType);

  const [selectedToolId, setSelectedToolId] = useState<string>(storedSelections.toolId);
  const [selectedFileSubtypeIndex, setSelectedFileSubtypeIndex] = useState<number>(storedSelections.fileSubtypeIndex);
  const [fileName, setFileName] = useState<string>(storedSelections.fileName);
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
    if (filteredAiTools.length === 0) {
      return "";
    }

    const hasSelectedTool = filteredAiTools.some((tool) => tool.id === selectedToolId);
    return hasSelectedTool ? selectedToolId : filteredAiTools[0].id;
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

  const hasHeaderFields = useMemo(() => {
    if (!effectiveSelectedToolId) {
      return false;
    }

    const result = buildTemplateForm(
      effectiveSelectedToolId,
      selectedType,
      "header",
      fileName,
      description,
      effectiveFileSubtypeIndex
    );

    return result.section.fields.length > 0;
  }, [description, effectiveFileSubtypeIndex, effectiveSelectedToolId, fileName, selectedType]);

  useEffect(() => {
    persistSelections(
      selectedType,
      effectiveSelectedToolId,
      effectiveFileSubtypeIndex,
      fileName,
      description,
      headerFormValues,
      bodyFormValues
    );
  }, [
    selectedType,
    effectiveSelectedToolId,
    effectiveFileSubtypeIndex,
    fileName,
    description,
    headerFormValues,
    bodyFormValues
  ]);

  function handleBackToPhaseOne() {
    clearSelections();
    setSelectedType(defaultType);
    setSelectedToolId(defaultToolId);
    setSelectedFileSubtypeIndex(defaultFileSubtypeIndex);
    setFileName(defaultFileName);
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
            onTypeChange={setSelectedType}
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
            onToolChange={(toolId) => {
              setSelectedToolId(toolId);
              setSelectedFileSubtypeIndex(0);
            }}
            onFileSubtypeChange={setSelectedFileSubtypeIndex}
          />
          <NavbarWizard 
            currentStep={2} 
            selectedType={selectedType}
            onForward={() => setStep(3)}
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
            fileName={fileName}
            onFileNameChange={setFileName}
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
            fileName={fileName}
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
            fileName={fileName}
          />

          <TemplateHeaderStep
            selectedToolId={effectiveSelectedToolId}
            selectedFileSubtypeIndex={effectiveFileSubtypeIndex}
            selectedType={selectedType}
            entityName={fileName}
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
            fileName={fileName}
          />

          <TemplateBodyStep
            selectedToolId={effectiveSelectedToolId}
            selectedFileSubtypeIndex={effectiveFileSubtypeIndex}
            selectedType={selectedType}
            entityName={fileName}
            entityDescription={description}
            values={bodyFormValues}
            onValuesChange={setBodyFormValues}
          />

          <NavbarWizard
            currentStep={6}
            selectedType={selectedType}
            onForward={() => setStep(6)}
            onBack={() => setStep(5)}
            onCancel={handleBackToPhaseOne}
          />
        </section>
      );
  }
}
