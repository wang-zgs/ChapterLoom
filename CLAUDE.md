# ChapterLoom

Claude Code should use the same repository conventions as documented in [AGENTS.md](AGENTS.md).

## Best Entry Points

- App shell: `src/App.tsx`
- Writing state: `src/useWriterState.ts`
- Persistence: `src/storage.ts`
- AI proxy: `server.mjs`

## Commands

- `npm run dev`
- `npm run build`
- `npm run preview`

## Working Notes

- Keep the writing workflow stable first; AI failures should fail soft.
- Preserve existing chapter data and migration compatibility.
- If a change affects UI, check the layout on both desktop and mobile sizes.