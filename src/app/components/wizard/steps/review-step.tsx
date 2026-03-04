import { useTranslations } from "next-intl";

import type { ReviewStepProps } from "./review-step.types";

export default function ReviewStep({ 
  markdown,
  installHint,
  customFileNameField,
  customFileNameValue,
  outputFileNamePreview,
  onCustomFileNameValueChange
}: ReviewStepProps) {
  const t = useTranslations("Step7");
  const customFileNameHintId = customFileNameField ? "custom-file-name-hint-review" : undefined;

  return (
    <>
      <h2 className="text-2xl font-semibold text-foreground">{t("phaseTitle")}</h2>
      <p className="mt-2 text-base text-foreground/80">{t("phaseDescription")}</p>

      <div className="mt-6 flex flex-col gap-3 text-left">
        <label htmlFor="review-markdown" className="text-sm font-medium text-foreground">
          {t("markdownLabel")}
        </label>

        <textarea
          id="review-markdown"
          name="reviewMarkdown"
          value={markdown}
          readOnly
          rows={14}
          className="w-full rounded-lg border border-black/20 bg-transparent px-3 py-2 text-base text-foreground outline-none focus-visible:ring-2 focus-visible:ring-foreground/50 dark:border-white/25"
        />

      {customFileNameField ? (
        <div className="mt-4 flex flex-col gap-3 text-left">
          <label htmlFor="custom-file-name-review" className="text-sm font-medium text-foreground">
            {customFileNameField.label}:
          </label>

          <div className="flex h-14 items-center rounded-2xl border-2 border-black/80 px-4 dark:border-white/70">
            <input
              id="custom-file-name-review"
              name="customFileNameReview"
              type="text"
              value={customFileNameValue}
              onChange={(event) => onCustomFileNameValueChange(event.target.value)}
              required={customFileNameField.required}
              aria-required={customFileNameField.required}
              aria-describedby={customFileNameField.hint ? customFileNameHintId : undefined}
              className="h-full min-w-0 flex-1 bg-transparent text-1xl font-semibold text-foreground outline-none"
            />
          </div>

          <p className="text-base font-semibold text-foreground/60">{outputFileNamePreview}</p>

          {customFileNameField.hint ? (
            <p id={customFileNameHintId} className="text-sm text-foreground/80">
              {customFileNameField.hint}
            </p>
          ) : null}
        </div>
      ) : null}

      {installHint ? (
        <div className="mt-4 rounded-lg border border-black/10 bg-gray-100 p-4 text-left dark:border-white/15 dark:bg-background">
          <p className="text-sm font-medium text-foreground">{t("tipsTitle")}</p>
          <p className="mt-2 text-sm text-foreground/80">{installHint}</p>
        </div>
      ) : null}        
      </div>
    </>
  );
}
