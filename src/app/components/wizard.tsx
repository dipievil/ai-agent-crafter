import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import aiToolsData from "@/data/ai-tools.json";
import type { AiToolData, AiToolOption, FileType } from "@/types/wizard/common";
import NavbarWizard from "./navbar-wizard";

import { StepsWizardProps } from "./wizard.types";
import AiTypeStep from "./wizard/ai-type-step";
import FileTypeStep from "./wizard/file-type-step";
import FileNameStep from "./wizard/file-name-step";
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
  const [step, setStep] = useState<1 | 2 | 3>(1);

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
  const defaultFileName = "";

  const storedSelections = readStoredSelections(defaultType, defaultToolId, defaultFileName, aiTools);

  const [selectedType, setSelectedType] = useState<FileType>(storedSelections.fileType);

  const [selectedToolId, setSelectedToolId] = useState<string>(storedSelections.toolId);
  const [fileName, setFileName] = useState<string>(storedSelections.fileName);

  useEffect(() => {
    persistSelections(selectedType, selectedToolId, fileName);
  }, [selectedType, selectedToolId, fileName]);

  function handleBackToPhaseOne() {
    clearSelections();
    setSelectedType(defaultType);
    setSelectedToolId(defaultToolId);
    setFileName(defaultFileName);
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
            selectedType={selectedType}
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
            selectedType={selectedType} />
          <AiTypeStep
            selectedToolId={selectedToolId}
            aiTools={aiTools}
            onToolChange={setSelectedToolId}
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
        <section className="w-full max-w-xl items-center rounded-2xl border border-black/10 bg-background p-6 shadow-sm dark:border-white/15">
          <SummarySection
            currentStep={3}
            aiTools={aiTools}
            selectedToolId={selectedToolId}
            selectedType={selectedType} />
          <FileNameStep
            selectedType={selectedType}
            fileName={fileName}
            onFileNameChange={setFileName}
          />
          <NavbarWizard
            currentStep={3}
            selectedType={selectedType}
            onBack={handleBackToPhaseOne}
          />
        </section>
      );
  }
}
