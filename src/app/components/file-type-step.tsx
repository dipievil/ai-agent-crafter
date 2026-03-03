import type { FileType, FileTypeStepProps } from "./wizard.types";
import { useTranslations } from "next-intl";

export default function FileTypeStep({
  selectedType,
  fileOptions,
  onTypeChange
}: FileTypeStepProps) {

  const t = useTranslations("Step1");

  return (
    <>
      <h2 className="text-2xl font-semibold text-foreground">{t("phaseTitle")}</h2>
      <p className="mt-2 text-base text-foreground/80">{t("phaseDescription")}</p>

      <div className="mt-6 flex flex-col gap-3">
        <label htmlFor="file-type" className="text-sm font-medium text-foreground">
          {t("fileTypeLabel")}
        </label>
        <select
          id="file-type"
          name="fileType"
          value={selectedType}
          onChange={(event) => onTypeChange(event.target.value as FileType)}
          className="h-11 rounded-lg border border-black/20 bg-transparent px-3 text-base text-foreground outline-none focus-visible:ring-2 focus-visible:ring-foreground/50 dark:border-white/25"
        >
          {fileOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>    
    </>
  );
}
