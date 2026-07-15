# ChapterLoom Agent Guide

This repository is a Vite + React + TypeScript long-form writing app.

## Quick Start

- Install dependencies: `npm install`
- Start development mode: `npm run dev`
- Build for production: `npm run build`
- Preview the production build: `npm run preview`

## Architecture Notes

- `src/App.tsx` is the composition root.
- `src/useWriterState.ts` owns most writing and AI behavior.
- `src/storage.ts` handles local persistence and state migration.
- `src/components/` contains the main UI panels.
- `server.mjs` is the local AI proxy used during development.

## Editing Rules

- Keep changes minimal and focused.
- Prefer local, root-cause fixes over surface-only patches.
- Do not remove user changes or generated files unless the task explicitly asks for it.
- Re-run `npm run build` after modifying app logic, state, or build-related files.

## AI / Model Integration

- The app supports both Ollama and OpenAI-compatible providers.
- Remote model calls should go through the local proxy during development.
- If you change provider settings or persistence, verify state migration still loads older saves.

## Repository Hygiene

- The repo currently contains build artifacts and generated TypeScript config outputs.
- Avoid committing new generated files unless they are required for the requested change.
- If you need to inspect the GitHub-facing metadata, update the README first; GitHub repository description and topics are not managed by the app itself.