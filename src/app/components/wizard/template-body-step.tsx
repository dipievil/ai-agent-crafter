import TemplateSectionStep from "./template-section";
import type { TemplateBodyStepProps } from "./template-body-step.types";

export default function TemplateBodyStep(props: TemplateBodyStepProps) {
  return <TemplateSectionStep {...props} section="body" translationNamespace="Step6" />;
}
