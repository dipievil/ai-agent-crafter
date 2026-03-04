import type { TemplateHeaderStepProps } from "./template-header-step.types";
import TemplateSectionStep from "../template-section";

export default function TemplateHeaderStep(props: TemplateHeaderStepProps) {
  return <TemplateSectionStep {...props} section="header" translationNamespace="Step5" />;
}
