import { useTranslations } from "next-intl";

import type { ReviewStepProps } from "./review-step.types";

export default function ReviewStep({ 
  markdown,
  installHint,
  filenameSegments,
  filenameSegmentValues,
  outputFileNamePreview,
  onFilenameSegmentValueChange
}: ReviewStepProps) {
  const t = useTranslations("Step7");

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

      {filenameSegments.length > 0 ? (
        <div className="mt-4 flex flex-col gap-3 text-left">
          {filenameSegments.map((segment) => {
            const hintId = segment.hint ? `filename-segment-hint-review-${segment.key}` : undefined;
            const inputId = `filename-segment-review-${segment.key}`;

            return (
              <div key={segment.key} className="flex flex-col gap-3 text-left">
                <label htmlFor={inputId} className="text-sm font-medium text-foreground">
                  {segment.name}:
                </label>

                <div className="flex h-14 items-center rounded-2xl border-2 border-black/80 px-4 dark:border-white/70">
                  <input
                    id={inputId}
                    name={inputId}
                    type="text"
                    value={filenameSegmentValues[segment.key] ?? ""}
                    onChange={(event) => onFilenameSegmentValueChange(segment.key, event.target.value)}
                    required={segment.required}
                    aria-required={segment.required}
                    aria-describedby={hintId}
                    className="h-full min-w-0 flex-1 bg-transparent text-1xl font-semibold text-foreground outline-none"
                  />
                </div>

                {segment.hint ? (
                  <p id={hintId} className="text-sm text-foreground/80">
                    {segment.hint}
                  </p>
                ) : null}
              </div>
            );
          })}

          <p className="text-base font-semibold text-foreground/60">{outputFileNamePreview}</p>
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
