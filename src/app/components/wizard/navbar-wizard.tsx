import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { FileType } from "@/types/wizard/common";
import { CONTINUE_EMOJI, DOWNLOAD_EMOJI } from "@/utils/constants";
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

  const startButtonEmoji = useMemo(() => emojiByType[selectedType], [selectedType]); 
  const forwardLabel = currentStep === 7 ?t("downloadButton"): t("continueButton");
  const forwardEmoji = currentStep === 7 ? DOWNLOAD_EMOJI : CONTINUE_EMOJI;
  const cancelLabel = currentStep === 7 ? t("finishButton") : t("cancelButton");
  const cancelButtonClassName = currentStep === 7
    ? "inline-flex h-11 w-full items-center justify-center rounded-full border border-black/20 px-4 text-base font-semibold opacity-100 transition-opacity hover:opacity-80 dark:border-white/25 bg-emerald-600 text-white"
    : "inline-flex h-11 w-full items-center justify-center rounded-full border border-black/20 px-4 text-base font-semibold opacity-100 transition-opacity hover:opacity-80 dark:border-white/25 bg-pink-500 text-white";

  return (
    <div className="mt-6 flex flex-col gap-3 sm:flex-row">

      {(onCancel && currentStep > 2) && (
        <button
            type="button"
            onClick={onCancel}
            className={cancelButtonClassName}
          >
            {cancelLabel}
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
            <span aria-hidden="true">{startButtonEmoji}</span>
        </button>  
      ) : onForward ? (
      <button
        type="button"
        onClick={onForward}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border-black/20 px-4 text-base font-semibold opacity-100 transition-opacity hover:opacity-80 text-white bg-emerald-400"
      >
        <span>{forwardLabel}</span>
        <span aria-hidden="true">{forwardEmoji}</span>
      </button>
      ) : null}
    </div>
  );    
}
