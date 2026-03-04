import { describe, expect, it } from "vitest";

import { buildTemplateMarkdown } from "./wizard.markdown-builder.service";

describe("wizard.markdown-builder.service", () => {
  it("builds markdown with frontmatter header and body sections", () => {
    const result = buildTemplateMarkdown({
      aitype: "github-copilot",
      filetype: "specific-instructions",
      entityName: "Meu Agente",
      entityDescription: "Descrição principal",
      fileSubtypeIndex: 0,
      headerFormValues: {
        applyto: "**/*.ts"
      },
      bodyFormValues: {
        maininstructions: "Siga os padrões do projeto"
      }
    });

    expect(result.output.header).toContain("description: Descrição principal");
    expect(result.output.header).toContain("applyTo: **/*.ts");
    expect(result.output.body).toContain("# Copilot Instructions");
    expect(result.output.body).toContain("Siga os padrões do projeto");
    expect(result.output.markdown.startsWith("---")).toBe(true);
  });

  it("warns when section type is inferred for header fields without explicit type", () => {
    const result = buildTemplateMarkdown({
      aitype: "github-copilot",
      filetype: "specific-instructions",
      entityName: "Meu Agente",
      entityDescription: "Descrição",
      fileSubtypeIndex: 0,
      headerFormValues: {
        applyto: "**/*.ts"
      },
      bodyFormValues: {}
    });

    expect(result.warnings.some((warning) => warning.code === "section-type-inferred")).toBe(true);
  });

  it("supports object-key alias as objects-key and warns about inconsistency", () => {
    const result = buildTemplateMarkdown({
      aitype: "github-copilot",
      filetype: "agent-instructions",
      entityName: "Agente X",
      entityDescription: "Descrição X",
      headerFormValues: {
        "argument-hint": ["Primeiro item", "Segundo item"]
      },
      bodyFormValues: {}
    });

    expect(result.output.header).toContain(
      'argument-hint: [{"value":"Primeiro item"},{"value":"Segundo item"}]'
    );
    expect(result.warnings.some((warning) => warning.code === "section-type-alias")).toBe(true);
  });

  it("keeps list-simple body sections as markdown bullets", () => {
    const result = buildTemplateMarkdown({
      aitype: "agent-zero",
      filetype: "agent-instructions",
      entityName: "Agent Zero",
      entityDescription: "Descrição",
      fileSubtypeIndex: 1,
      headerFormValues: {},
      bodyFormValues: {
        role: "Você é um assistente técnico",
        actions: ["Responder dúvidas", "Gerar instruções"]
      }
    });

    expect(result.output.body).toContain("# role");
    expect(result.output.body).toContain("- Responder dúvidas");
    expect(result.output.body).toContain("- Gerar instruções");
  });
});
