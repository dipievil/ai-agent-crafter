import { getTranslations } from "next-intl/server";

export default async function Footer() {
  const t = await getTranslations("Footer");

  const version = process.env.NEXT_PUBLIC_APP_VERSION ?? "0.0.0";
  const commit = process.env.NEXT_PUBLIC_COMMIT_SHA ?? "unknown";

  return (
    <footer
      className="fixed bottom-0 left-0 z-50 w-full border-t border-foreground/10 bg-background/90 py-1.5 backdrop-blur-sm"
      role="contentinfo"
      aria-label={t("ariaLabel")}
    >
      <p className="text-center font-mono text-xs text-foreground/50">
        {t("version", { version, commit })}
      </p>
    </footer>
  );
}
