import type { FileType } from "@/types/wizard/templateFiles";

export type NavbarWizardStepProps = {
  currentStep: number;
  selectedType: FileType;
  onForward?: () => void;
  onBack?: () => void;    
}