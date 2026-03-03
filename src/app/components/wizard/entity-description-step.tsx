import { useTranslations } from "next-intl";
import { fileTypes } from "@/utils/constants";
import type { EntityDescriptionStepProps } from "./entity-description-step.types";

export default function EntityDescriptionStep({
  selectedType,
  description,
  onDescriptionChange
}: EntityDescriptionStepProps) {
  const t = useTranslations("Step4");

  return (
    <>
      <h2 className="text-2xl font-semibold text-foreground">{t("phaseTitle")}</h2>
      <p className="mt-2 text-base text-foreground/80">{t("phaseDescription")}</p>

      <div className="mt-6 flex flex-col gap-3 text-left">
        <label htmlFor="agent-description" className="text-sm font-medium text-foreground">
          {t("descriptionForType", {
            item: t(`entities.${fileTypes[selectedType]}.name`)
          })}
        </label>

        <textarea
          id="agent-description"
          name="agentDescription"
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
          placeholder={t(`entities.${fileTypes[selectedType]}.descriptionPlaceholder`)}
          rows={4}
          className="w-full rounded-lg border border-black/20 bg-transparent px-3 py-2 text-base text-foreground outline-none focus-visible:ring-2 focus-visible:ring-foreground/50 dark:border-white/25"
        />

        <p className="text-sm text-foreground/80">{t(`entities.${fileTypes[selectedType]}.helperText`)}</p>
      </div>
    </>
  );
}