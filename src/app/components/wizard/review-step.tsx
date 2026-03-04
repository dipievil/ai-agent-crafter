import { useTranslations } from "next-intl";

import type { ReviewStepProps } from "./review-step.types";

export default function ReviewStep({ 
  markdown,
  installHint
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
