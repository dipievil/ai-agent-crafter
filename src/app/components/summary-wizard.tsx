import { useMemo } from "react";
import type { SummarySectionProps } from "./summary-wizard.types";
import { fileTypes } from "../../utils/constants";
import { useTranslations } from "next-intl";

export default function SummarySection({
  currentStep = 1,
  selectedType,
  selectedToolId,
  fileName,
  aiTools,
}: SummarySectionProps) {
    const t = useTranslations("HomePage");

  const selectedTool = useMemo(
    () => aiTools.find((tool) => tool.id === selectedToolId) ?? aiTools[0],
    [aiTools, selectedToolId]
  );
  
  return (
    <>
      {selectedType && currentStep === 2 && (
        <>
          <p className="text-sm text-left text-foreground/80">{t("creatingAType")}</p>
          <p className="mt-1 text-left text-1xl font-semibold text-foreground">{t(`options.${fileTypes[selectedType]}`)}</p>
        </>
      )}
      {selectedType && selectedToolId != undefined && currentStep > 2 && currentStep < 4 && (
        <>
          <p className="text-2xl text-left  text-foreground/80">
            {t("creating")} <b>{t(`options.${fileTypes[selectedType]}`)}</b> {t("for")} <b>{selectedTool?.name}</b>
          </p>
        </>
      )}
      {selectedType && selectedToolId != undefined && currentStep >= 4 && (
        <>
          <p className="text-sm text-left text-foreground/80">{t("creatingFor")}</p>
          <p className="mt-1 text-left text-2xl font-semibold text-foreground">
            <b>{t(`options.${fileTypes[selectedType]}`)}</b> {fileName ?? ""} {t("for")} <b>{selectedTool?.name}</b>
          </p>
        </>
      )}
      {selectedType &&(
        <hr className="my-8 h-px border-t-0 bg-gray-300" />
      )}
    </>
  );
}
