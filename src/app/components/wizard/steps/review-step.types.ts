import type { FileNameCustomField } from "./ai-type-step.types";

export type ReviewStepProps = {
  markdown: string;
  installHint?: string;
  customFileNameField?: FileNameCustomField;
  customFileNameValue: string;
  outputFileNamePreview: string;
  onCustomFileNameValueChange: (value: string) => void;
};
