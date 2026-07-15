# ChapterLoom

<p align="center">
  <img src="public/cover.svg" alt="ChapterLoom cover" width="800">
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
  <img src="https://img.shields.io/badge/React-18.3-61DAFB?logo=react" alt="React 18.3">
  <img src="https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript" alt="TypeScript 5.6">
  <img src="https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite" alt="Vite 5.4">
  <a href="https://github.com/wang-zgs/ChapterLoom/issues"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome"></a>
</p>

> [中文版](README.md)

ChapterLoom is an AI-powered long-form writing tool designed for novels, web fiction, screenplays, and world-building documents. It features chapter management, auto-save, full-text search, character/setting cards, chapter summaries, version history, and support for both Ollama and OpenAI-compatible models.

## Features

- **Chapter Management** — Create, switch, rename, and delete chapters with ease
- **Continuous Writing** — Quick navigation between chapters; create the next chapter instantly
- **Auto-Save** — Local persistence works offline and never loses your work
- **Full-Text Search** — Search across all chapters and jump to results
- **AI Chat** — Ask questions about your current writing context
- **Selectable Context** — Choose which chapters the AI can reference
- **Local & Cloud Models** — Switch between Ollama and OpenAI-compatible endpoints
- **Creative Library** — Character cards, setting cards, chapter summaries, version snapshots
- **Import / Export** — Backup and migrate your data anytime

## Tech Stack

- React 18
- TypeScript 5
- Vite 5
- Node.js local AI proxy

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Start development

```bash
npm run dev
```

This launches both the web app and the local AI proxy concurrently.

### 3. Build for production

```bash
npm run build
```

### 4. Preview production build

```bash
npm run preview
```

## AI Configuration

### Local Ollama

1. Install and start Ollama
2. Pull a model, for example:

```bash
ollama pull qwen3.6:27b
```

3. Open Settings and switch to "Local Model"
4. API address is typically:

```text
http://localhost:11434
```

5. Model name is whatever you pulled locally, e.g.:

```text
qwen3.6:27b
```

Local models usually don't require an API key.

### OpenAI-Compatible Endpoint

If you use a cloud model or OpenAI-compatible service:

1. Open Settings and switch to "Cloud Model"
2. Enter the endpoint URL, model name, and API key
3. Example endpoint:

```text
https://api.openai.com/v1/chat/completions
```

## Project Structure

```text
src/
  components/       UI components
  ai.ts             AI context builder
  renderMarkdown.ts Markdown renderer
  storage.ts        Local persistence
  types.ts          Type definitions
  utils.ts          Utility functions
  useWriterState.ts State and business logic
server.mjs          Local AI proxy
```

## Privacy

- All writing content is stored in your browser's local storage
- API keys are stored locally and never uploaded to third parties
- You control which context is sent to the AI

## Roadmap

- Rich text editing improvements
- Better version management
- Chapter outlines and writing goals
- Cloud sync
- Desktop packaging
- Smarter AI memory system

## License

This project is open source under the [MIT](LICENSE) license.

## Agent Collaboration

See [AGENTS.md](AGENTS.md) and [CLAUDE.md](CLAUDE.md) for instructions on how Codex, Claude Code, and other AI agents can work with this repository.

## Contributing

Issues and pull requests are welcome.

- Feature requests: please describe the use case and expected outcome
- Bug reports: include reproduction steps and screenshots if possible
- Before submitting code, run `npm run build`

---

*ChapterLoom — long-form writing workspace*