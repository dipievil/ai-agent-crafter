"use client";

import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "ai-agent-crafter-form";

export type FileType =
  | "agent-instructions"
  | "specific-instructions"
  | "prompts"
  | "skill";

type FileTypeOption = {
  value: FileType;
  label: string;
};

type FileTypeStepProps = {
  phaseTitle: string;
  phaseDescription: string;
  selectLabel: string;
  startLabel: string;
  options: FileTypeOption[];
};

const emojiByType: Record<FileType, string> = {
  "agent-instructions": "🤖",
  "specific-instructions": "📓",
  prompts: "📜",
  skill: "⚒️"
};

function isFileType(value: unknown): value is FileType {
  return (
    value === "agent-instructions" ||
    value === "specific-instructions" ||
    value === "prompts" ||
    value === "skill"
  );
}

export default function FileTypeStep({
  phaseTitle,
  phaseDescription,
  selectLabel,
  startLabel,
  options
}: FileTypeStepProps) {
  const defaultValue = options[0]?.value ?? "agent-instructions";
  const [selectedType, setSelectedType] = useState<FileType>(() => {
    if (typeof window === "undefined") {
      return defaultValue;
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);

      if (!raw) {
        return defaultValue;
      }

      const parsed = JSON.parse(raw) as { fileType?: unknown };

      return isFileType(parsed.fileType) ? parsed.fileType : defaultValue;
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};

      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...parsed, fileType: selectedType })
      );
    } catch {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ fileType: selectedType })
      );
    }
  }, [selectedType]);

  const buttonEmoji = useMemo(() => emojiByType[selectedType], [selectedType]);

  return (
    <section className="w-full max-w-md rounded-2xl border border-black/10 bg-background p-6 shadow-sm dark:border-white/15">
      <h2 className="text-2xl font-semibold text-foreground">{phaseTitle}</h2>
      <p className="mt-2 text-base text-foreground/80">{phaseDescription}</p>

      <div className="mt-6 flex flex-col gap-3">
        <label htmlFor="file-type" className="text-sm font-medium text-foreground">
          {selectLabel}
        </label>
        <select
          id="file-type"
          name="fileType"
          value={selectedType}
          onChange={(event) => setSelectedType(event.target.value as FileType)}
          className="h-11 rounded-lg border border-black/20 bg-transparent px-3 text-base text-foreground outline-none focus-visible:ring-2 focus-visible:ring-foreground/50 dark:border-white/25"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-foreground px-4 text-base font-semibold text-background transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <span>{startLabel}</span>
        <span aria-hidden="true">{buttonEmoji}</span>
      </button>
    </section>
  );
}
