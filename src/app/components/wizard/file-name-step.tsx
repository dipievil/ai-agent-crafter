import { useTranslations } from "next-intl";
import { fileTypes } from "@/utils/constants";
import type { FileNameStepProps } from "./file-name-step.types";

export default function FileNameStep({
  selectedType,
  fileName,
  onFileNameChange
}: FileNameStepProps) {
  const t = useTranslations("Step3");

  return (
    <>
      <h2 className="text-2xl font-semibold text-foreground">{t("phaseTitle")}</h2>
      <p className="mt-2 text-base text-foreground/80">{t("phaseDescription")}</p>

      <div className="mt-6 flex flex-col gap-3">
        <label htmlFor="file-name" className="text-sm font-medium text-foreground">
          {t("nameForType", {
            item: t(`entities.${fileTypes[selectedType]}`)
          })}
        </label>

        <input
          id="file-name"
          name="fileName"
          type="text"
          value={fileName}
          onChange={(event) => onFileNameChange(event.target.value)}
          placeholder={t("fileNamePlaceholder")}
          className="h-11 rounded-lg border border-black/20 bg-transparent px-3 text-base text-foreground outline-none focus-visible:ring-2 focus-visible:ring-foreground/50 dark:border-white/25"
        />

        <p className="text-sm text-foreground/80">{t("helperText")}</p>

        <div>
          <p className="text-sm font-medium text-foreground">{t("examplesTitle")}</p>
          <ul className="mt-1 list-inside list-disc text-sm text-foreground/80">
            <li>{t("examples.one")}</li>
            <li>{t("examples.two")}</li>
            <li>{t("examples.three")}</li>
            <li>{t("examples.four")}</li>
          </ul>
        </div>
      </div>
    </>
  );
}
