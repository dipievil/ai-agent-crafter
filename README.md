# Ai Agent Crafter

A web tool to help users to generate AI Agent instruction files for several agents including templates and UI guided form.

## How This App Work

User will access the app on the web. With a single form based workflow he will answer some basic answers, and then the system will generate a complete md file for the agent instructions, prompts and skills.

### Detailed workflow

1. Access the app
2. Choose a agent type from a dropdownlist (Copilot, AGENTS.md, Agent-Zero, etc)
3. Choose a file type from a list: main instruction, specific instructions, prompts, skill
4. Fill up all content specific for this kind of agent and file type like name, overview, response style, etc
5. Click on Generate button and the file will be avaiable to download

## How to run locally

Start a development server [http://localhost:3000](http://localhost:3000).

```bash
bun dev
```

To run a production build

```bash
bun build
```

Start production server

```bash
bun start
```

Run ESLint

```bash
bun lint
```

## Development detailed information

Check the docs on [docs/development.md](docs/development.md)

## Stack

- Typescript
- Framework Next.js
- Tailwind CSS for styling
