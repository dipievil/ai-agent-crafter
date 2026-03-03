import { useEffect, useMemo, useState } from "react";
import type { SummarySectionProps } from "./summary.types";
import { useTranslations } from "next-intl";

export default function SummarySection({
  currentStep = 1,
  selectedType,
  selectedToolId,
  aiTools,
  onToolChange,
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
          <p className="mt-1 text-left text-3xl font-semibold text-foreground">{t(`options.${selectedType}`)}</p>
        </>
      )}
      {selectedToolId != undefined && currentStep === 3 && (
        <>
          <p className="text-sm text-left text-foreground/80">{t("creatingFor")}</p>
          <p className="mt-1 text-left text-3xl font-semibold text-foreground">{selectedTool?.name}</p>
        </>
      )}    
    </>
  );
}
