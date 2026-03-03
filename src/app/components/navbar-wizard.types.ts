import type { FileType } from "@/types/wizard/common";

export type NavbarWizardStepProps = {
  currentStep: number;
  selectedType: FileType;
  onForward?: () => void;
  onBack?: () => void;    
}