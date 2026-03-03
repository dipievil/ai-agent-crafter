import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { AiTypeStepProps } from "./ai-type-step.types";

export default function AiTypeStep({
  selectedToolId,
  aiTools,
  onToolChange
}: AiTypeStepProps) {
  const t = useTranslations("Step2");

  const selectedTool = useMemo(
    () => aiTools.find((tool) => tool.id === selectedToolId) ?? aiTools[0],
    [aiTools, selectedToolId]
  );

  return (
    <>
      <h2 className="text-2xl font-semibold text-foreground">{t("phaseTitle")}</h2>
      <p className="mt-2 text-base text-foreground/80">{t("phaseDescription")}</p>

      <div className="mt-6 flex flex-col gap-3">
        <label htmlFor="ai-tool" className="text-sm font-medium text-foreground">
          {selectedTool?.name}
        </label>
        <select
          id="ai-tool"
          name="aiTool"
          value={selectedToolId}
          onChange={(event) => onToolChange(event.target.value)}
          className="h-11 rounded-lg border border-black/20 bg-transparent px-3 text-base text-foreground outline-none focus-visible:ring-2 focus-visible:ring-foreground/50 dark:border-white/25"
        >
          {aiTools.map((tool) => (
            <option key={tool.id} value={tool.id}>
              {tool.name}
            </option>
          ))}
        </select>
      </div>

      {selectedTool?.url ? (
        <div className="mt-4 rounded-lg border border-black/10 bg-gray-100 p-4 text-left dark:border-white/15 dark:bg-background">
          <p className="text-sm text-foreground/80">{selectedTool?.description}</p>
          <a
            className="mt-2 inline-block text-sm font-medium underline underline-offset-2"
            href={selectedTool?.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("officialSite")}
          </a>
        </div>
      ) : null}

    </>
  );
}
