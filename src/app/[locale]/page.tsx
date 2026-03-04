"use client";

import { useTranslations } from "next-intl";
import { FileTypeOption } from "@/types/wizard/common";
import { fileTypes } from "@/utils/constants";
import {
  clearSelections
} from "@/features/wizard/infra/wizard.storage.service";

import StepsWizard from "../components/wizard";

export default function Home() {
  const t = useTranslations("HomePage");

  const fileOptions: FileTypeOption[] = Object.entries(fileTypes).map(([value, label]) => ({
    value: value as FileTypeOption["value"],
    label: t(`options.${label}`)
  }));

  clearSelections();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only absolute left-2 top-2 z-10 rounded-md border border-foreground bg-background px-3 py-2 text-sm font-medium focus:not-sr-only"
      >
        {t("skipToContent")}
      </a>

      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center px-4 pb-10 pt-10 text-center sm:px-6"
      >
        <h1 className="text-balance text-shadow-sm text-3xl font-bold tracking-tight sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-4 max-w-2xl text-pretty text-base text-foreground/80 sm:text-lg">
          {t("subtitle")}
        </p>

        <div className="mt-8 w-full max-w-2xl items-center">
          <StepsWizard
            fileOptions={fileOptions}
          />
        </div>
      </main>
    </div>
  );
}
