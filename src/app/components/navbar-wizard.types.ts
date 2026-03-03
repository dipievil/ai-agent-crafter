import type { FileType } from "./wizard.types";

export type NavbarWizardStepProps = {
  currentStep: number;
  selectedType: FileType;
  onForward?: () => void;
  onBack?: () => void;    
}