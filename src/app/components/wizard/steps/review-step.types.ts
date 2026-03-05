import type { FileNameSegmentField } from "./ai-type-step.types";

export type ReviewStepProps = {
  markdown: string;
  installHint?: string;
  filenameSegments: FileNameSegmentField[];
  filenameSegmentValues: Record<string, string>;
  outputFileNamePreview: string;
  onFilenameSegmentValueChange: (segmentKey: string, value: string) => void;
};
