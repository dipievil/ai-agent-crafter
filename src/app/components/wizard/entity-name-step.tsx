import { useTranslations } from "next-intl";
import { fileTypes } from "@/utils/constants";
import type { EntityNameStepProps as EntityNameStepProps } from "./entity-name-step.types";

export default function EntityNameStep({
  selectedType,
  fileName,
  onFileNameChange
}: EntityNameStepProps) {
  const t = useTranslations("Step3");

  return (
    <>
      <h2 className="text-2xl font-semibold text-foreground">{t("phaseTitle")}</h2>
      <p className="mt-2 text-base text-foreground/80">{t("phaseDescription")}</p>

      <div className="mt-6 flex flex-col gap-3 text-left">
        <label htmlFor="file-name" className="text-sm font-medium text-foreground">
          {t("nameForType", {
            item: t(`entities.${fileTypes[selectedType]}.name`)
          })}
        </label>

        <input
          id="file-name"
          name="fileName"
          type="text"
          value={fileName}
          onChange={(event) => onFileNameChange(event.target.value)}
          placeholder={t(`entities.${fileTypes[selectedType]}.entityNamePlaceholder`)}
          className="h-11 rounded-lg border border-black/20 bg-transparent px-3 text-base text-foreground outline-none focus-visible:ring-2 focus-visible:ring-foreground/50 dark:border-white/25"
        />

        <p className="text-sm text-foreground/80">{t(`entities.${fileTypes[selectedType]}.helperText`)}</p>

        <div>
          <p className="text-sm font-medium text-foreground">{t("examplesLabel")}</p>
          <ul className="mt-1 italic list-inside list-disc text-sm text-foreground/80">
            <li>{t(`entities.${fileTypes[selectedType]}.examples.one`)}</li>
            <li>{t(`entities.${fileTypes[selectedType]}.examples.two`)}</li>
            <li>{t(`entities.${fileTypes[selectedType]}.examples.three`)}</li>
            <li>{t(`entities.${fileTypes[selectedType]}.examples.four`)}</li>
          </ul>
        </div>
      </div>
    </>
  );
}
