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
  onBack,
  onCancel
}: NavbarWizardStepProps) {

  const t = useTranslations("NavbarWizard");

  const buttonEmoji = useMemo(() => emojiByType[selectedType], [selectedType]);

  const baseButtonClasses = "";

  return (
    <div className="mt-6 flex flex-col gap-3 sm:flex-row">

      {(onCancel && currentStep > 2) && (
        <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-11 w-full items-center justify-center rounded-full border border-black/20 px-4 text-base font-semibold opacity-100 transition-opacity hover:opacity-80 dark:border-white/25 bg-pink-500 text-white "
          >
            {t("cancelButton")}
          </button>
      )}

      {(onBack && currentStep > 1) && (
        <button
            type="button"
            onClick={onBack}
            className="inline-flex h-11 w-full items-center justify-center rounded-full border border-black/20 px-4 text-base font-semibold opacity-100 transition-opacity hover:opacity-80 text-white dark:border-white/25 bg-cyan-500"
          >
            {t("backButton")}
          </button>
      )}

      {onForward && currentStep === 1 ? (
        <button
          type="button"
          onClick={onForward}
          className="inline-flex h-11 w-full items-center justify-center rounded-full border-black/20 px-4 text-base font-semibold transition-opacity hover:opacity-50 text-black bg-gray-100 dark:border-white/25 border-2 mt-6 gap-2"
          >
            <span>{t("startButton")}</span>
            <span aria-hidden="true">{buttonEmoji}</span>
        </button>  
      ) : onForward ? (
      <button
        type="button"
        onClick={onForward}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border-black/20 px-4 text-base font-semibold opacity-100 transition-opacity hover:opacity-80 text-white bg-emerald-400"
      >
        <span>{t("continueButton")}</span>
        <span aria-hidden="true">{CONTINUE_EMOJI}</span>
      </button>
      ) : null}
    </div>
  );    
}
