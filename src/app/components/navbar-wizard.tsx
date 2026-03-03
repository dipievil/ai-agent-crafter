import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { FileType } from "@/types/wizard/common";
import { CONTINUE_EMOJI } from "@/utils/constants";
import { NavbarWizardStepProps} from "./navbar-wizard.types";

const emojiByType: Record<FileType, string> = {
  "agent-instructions": "🤖",
  "specific-instructions": "📓",
  prompts: "📜",
  skills: "⚒️"
};

export default function NavbarWizard({
    currentStep,
    selectedType,
    onForward,
    onBack
}: NavbarWizardStepProps) {

  const t = useTranslations("NavbarWizard");

  const buttonEmoji = useMemo(() => emojiByType[selectedType], [selectedType]);

  return (
    <div className="mt-6 flex flex-col gap-3 sm:flex-row">

      {(onBack && currentStep === 2) && (
        <button
            type="button"
            onClick={onBack}
            className="inline-flex h-11 w-full bg-yellow-500 items-center justify-center rounded-full border border-black/20 px-4 text-base font-semibold text-foreground transition-opacity hover:opacity-80 dark:border-white/25"
          >
            {t("backButton")}
          </button>
      )}

      {onForward && currentStep === 1 ? (
        <button
          type="button"
          onClick={onForward}
          className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full px-4 text-base font-semibold text-background transition-opacity hover:opacity-80 bg-sky-500"
          >
            <span>{t("startButton")}</span>
            <span aria-hidden="true">{buttonEmoji}</span>
        </button>  
      ) : onForward ? (
      <button
        type="button"
        onClick={onForward}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full px-4 text-base font-semibold text-background transition-opacity hover:opacity-80 bg-emerald-500"
      >
        <span>{t("continueButton")}</span>
        <span aria-hidden="true">{CONTINUE_EMOJI}</span>
      </button>
      ) : null}

      

      {(onBack && currentStep > 2) && (
        <button
            type="button"
            onClick={onBack}
            className="inline-flex h-11 w-full bg-red-500 items-center justify-center rounded-full border border-black/20 px-4 text-base font-semibold text-foreground transition-opacity hover:opacity-80 dark:border-white/25"
          >
            {t("cancelButton")}
          </button>
      )}
    </div>
  );    
}
