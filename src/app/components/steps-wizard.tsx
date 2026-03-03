import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import aiToolsData from "@/data/ai-tools.json";
import type { AiToolData, AiToolOption } from "@/types/wizard/aiTools";
import type { FileType } from "@/types/wizard/templateFiles";
import NavbarWizard from "./navbar-wizard";

import { StepsWizardProps } from "./steps-wizard.types";
import AiTypeStep from "./wizard/ai-type-step";
import FileTypeStep from "./wizard/file-type-step";
import SummarySection from "./summary-wizard";

import {
  clearSelections,
  persistSelections,
  readStoredSelections
} from "@/features/wizard/infra/wizard.storage.service";


export default function StepsWizard({
  fileOptions: options
}: StepsWizardProps) {
  const defaultType = options[0]?.value ?? "agent-instructions";

  const tData = useTranslations("aiApps");
  const [step, setStep] = useState<1 | 2>(1);

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

  const storedSelections = readStoredSelections(defaultType, defaultToolId, aiTools);

  const [selectedType, setSelectedType] = useState<FileType>(storedSelections.fileType);

  const [selectedToolId, setSelectedToolId] = useState<string>(storedSelections.toolId);

  useEffect(() => {
    persistSelections(selectedType, selectedToolId);
  }, [selectedType, selectedToolId]);

  const selectedTool = useMemo(
    () => aiTools.find((tool) => tool.id === selectedToolId) ?? aiTools[0],
    [aiTools, selectedToolId]
  );

  function handleBackToPhaseOne() {
    clearSelections();
    setSelectedType(defaultType);
    setSelectedToolId(defaultToolId);
    setStep(1);
  }

  switch (step) {
    default: case 1:
      return (
        <section className="w-full max-w-xl items-center rounded-2xl border border-black/10 bg-background p-6 shadow-sm dark:border-white/15">
          <FileTypeStep
            selectedType={selectedType}
            fileOptions={options}
            onTypeChange={setSelectedType}
            />      
          <NavbarWizard 
            currentStep={1} 
            selectedType={selectedTool?.id as FileType} 
            onForward={() => setStep(2)} 
            onBack={handleBackToPhaseOne} />
        </section>
      );
    case 2:
      return (
        <section className="w-full max-w-xl items-center rounded-2xl border border-black/10 bg-background p-6 shadow-sm dark:border-white/15">
          <SummarySection
            currentStep={2}
            aiTools={aiTools}
            selectedToolId={selectedToolId}
            selectedType={selectedType}
            onToolChange={setSelectedToolId} />
          <AiTypeStep
            selectedToolId={selectedToolId}
            aiTools={aiTools}
            onBack={() => setStep(2)}
            onToolChange={setSelectedToolId}
          />
          <NavbarWizard 
            currentStep={2} 
            selectedType={selectedTool?.id as FileType} 
            onBack={handleBackToPhaseOne} />
        </section>
      );
  }
}
