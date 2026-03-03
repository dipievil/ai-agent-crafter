import type { NavbarWizardStepProps} from "./navbar-wizard.types";
import type { FileType } from "./wizard.types";
import { useTranslations } from "next-intl";
import { CONTINUE_EMOJI } from "../../utils/constants";
import { useMemo } from "react";

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
  
  console.log("NavbarWizard render", { currentStep, selectedType });

  return (
    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
      {onForward && (
        currentStep === 1 ? (
        <button
          type="button"
          onClick={currentStep === 1 ? onForward : undefined}
          className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-foreground px-4 text-base font-semibold text-background transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <span>{t("startButton")}</span>
            <span aria-hidden="true">{buttonEmoji}</span>
        </button>  
      ): (
      <button
        type="button"
        onClick={onForward}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-foreground px-4 text-base font-semibold text-background transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <span>{t("continueButton")}</span>
        <span aria-hidden="true">{CONTINUE_EMOJI}</span>
      </button>
      ))}

      {(onBack && currentStep != 1) && (
        <button
            type="button"
            onClick={onBack}
            className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-black/20 px-4 text-base font-semibold text-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:border-white/25"
          >
            {t("cancelButton")}
          </button>
      )}
    </div>
  );    
}
