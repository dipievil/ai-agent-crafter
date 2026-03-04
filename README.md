# AI Agent Crafter

![Vercel Deploy](https://deploy-badge.vercel.app/vercel/ai-agent-crafter)

Create ready-to-use instruction files for AI agents with a guided step-by-step wizard.

| 🇺🇸 [English Version](#english) | 🇧🇷 [Portuguese Version](#português) |

## Live App

- Production: https://ai-agent-crafter.vercel.app

---

## English

### What this app does

AI Agent Crafter helps you create instruction files, prompts, and skills for different AI tools (such as GitHub Copilot, Gemini, ChatGPT, Codex, Agent Zero, and standard formats).

Instead of writing everything manually, you complete a guided wizard and download a generated `.md` file.

### End-user flow (wizard)

1. Choose the file type you want to create.
2. Choose the AI tool.
3. Enter the entity name.
4. Enter the entity description.
5. Fill optional header fields (when required by the selected template).
6. Fill body/template fields.
7. Review generated markdown and download the output file.

### What you get

- Auto-generated markdown based on template definitions
- Suggested output file name (including custom prefixes when supported)
- Tool-specific install/use hint for the generated file
- Official website link for the selected AI tool

### Language support

- English
- Portuguese (Brazil)

### Local behavior

- Your current wizard selections are persisted in `localStorage` to improve continuity.

---

## Português

### O que o app faz

O AI Agent Crafter te ajuda a criar arquivos de instruções, prompts e skills para diferentes ferramentas de IA (como GitHub Copilot, Gemini, ChatGPT, Codex, Agent Zero e formatos padrão).

Em vez de escrever tudo do zero, você preenche um wizard guiado e baixa um arquivo `.md` pronto para uso.

### Fluxo para usuário final (wizard)

1. Escolha o tipo de arquivo que você quer criar.
2. Escolha a ferramenta de IA.
3. Informe o nome da entidade.
4. Informe a descrição da entidade.
5. Preencha campos opcionais de cabeçalho (quando o template exigir).
6. Preencha os campos do corpo/template.
7. Revise o markdown gerado e faça o download do arquivo final.

### O que você recebe

- Markdown gerado automaticamente com base no template
- Nome de arquivo sugerido (incluindo prefixos customizados quando suportado)
- Dica de instalação/uso específica da ferramenta escolhida
- Link para o site oficial da ferramenta de IA selecionada

### Idiomas disponíveis

- Inglês
- Português (Brasil)

### Comportamento local

- Suas seleções atuais do wizard ficam salvas no `localStorage` para facilitar continuidade.

---

## Run locally

Start development server:

```bash
bun dev
```

Build for production:

```bash
bun build
```

Run production server:

```bash
bun start
```

Run lint:

```bash
bun lint
```

Run tests:

```bash
bun test
```

## Development docs

- [docs/development.md](docs/development.md)

## Tech stack

- TypeScript
- Next.js 16 (App Router)
- React 19
- Tailwind CSS v4
- next-intl
