import { describe, expect, it } from "vitest";

import {
  buildTemplateForm,
  createTemplateFormSchemaService
} from "./wizard.form-schema.service";

describe("wizard.form-schema.service", () => {
  it("returns header-empty message when template/header is missing", () => {
    const result = buildTemplateForm(
      "standard",
      "specific-instructions",
      "header",
      "My agent",
      "My description"
    );

    expect(result.section.fields).toHaveLength(0);
    expect(result.meta.message).toBe("this format file dont need a header");
    expect(result.warnings.some((warning) => warning.code === "section-not-found")).toBe(true);
  });

  it("maps formats to input types for agent-instructions header", () => {
    const result = buildTemplateForm(
      "github-copilot",
      "agent-instructions",
      "header",
      "Agent One",
      "Agent Description"
    );

    const fieldsByName = Object.fromEntries(result.section.fields.map((field) => [field.name, field]));

    expect(fieldsByName["name"]?.inputType).toBe("input-single-line");
    expect(fieldsByName["description"]?.inputType).toBe("input-single-line");
    expect(fieldsByName["argument-hint"]?.inputType).toBe("tag-list-removable");
    expect(fieldsByName["mcp-servers"]?.inputType).toBe("textarea");
  });

  it("marks required fields with required variant", () => {
    const result = buildTemplateForm(
      "github-copilot",
      "specific-instructions",
      "body",
      "Entity Name",
      "Entity Description"
    );

    const mainInstructions = result.section.fields.find((field) => field.name === "maininstructions");

    expect(mainInstructions).toBeDefined();
    expect(mainInstructions?.required).toBe(true);
    expect(mainInstructions?.variant).toBe("required");
  });

  it("pre-fills name and description values from entity data", () => {
    const result = buildTemplateForm(
      "github-copilot",
      "agent-instructions",
      "header",
      "My Agent",
      "My Agent Description"
    );

    const nameField = result.section.fields.find((field) => field.name === "name");
    const descriptionField = result.section.fields.find((field) => field.name === "description");

    expect(nameField?.value).toBe("My Agent");
    expect(descriptionField?.value).toBe("My Agent Description");
  });

  it("supports translation resolver with warnings for missing keys", () => {
    const translations: Record<string, string> = {
      "templates.github-copilot.agent-instructions.header.name.label": "Nome Traduzido"
    };

    const service = createTemplateFormSchemaService((key) => translations[key]);
    const result = service.buildForm(
      "github-copilot",
      "agent-instructions",
      "header",
      "Nome",
      "Descrição"
    );

    const nameField = result.section.fields.find((field) => field.name === "name");

    expect(nameField?.label).toBe("Nome Traduzido");
    expect(result.warnings.some((warning) => warning.code === "translation-missing")).toBe(true);
  });

  it("returns fields only from the selected file subtype", () => {
    const allSubtypes = buildTemplateForm(
      "agent-zero",
      "agent-instructions",
      "body",
      "Agent",
      "Description"
    );

    const secondSubtypeOnly = buildTemplateForm(
      "agent-zero",
      "agent-instructions",
      "body",
      "Agent",
      "Description",
      1
    );

    const thirdSubtypeOnly = buildTemplateForm(
      "agent-zero",
      "agent-instructions",
      "body",
      "Agent",
      "Description",
      2
    );

    expect(allSubtypes.section.fields.length).toBe(18);
    expect(secondSubtypeOnly.section.fields.length).toBe(2);
    expect(thirdSubtypeOnly.section.fields.length).toBe(14);
  });

  it("skips fields marked as title section", () => {
    const result = buildTemplateForm(
      "github-copilot",
      "specific-instructions",
      "body",
      "Entity Name",
      "Entity Description",
      0
    );

    expect(result.section.fields.some((field) => field.name === "agentbehavior")).toBe(false);
  });
});
