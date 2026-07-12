import type { Chapter } from './types';

export function buildContext(chapters: Chapter[], selectedIds: string[], customContext: string) {
  const selectedChapters = chapters.filter((chapter) => selectedIds.includes(chapter.id));
  const fragments = selectedChapters.map((chapter) => {
    return `【章节】${chapter.title}\n${chapter.content.trim() || '（空）'}`;
  });

  if (customContext.trim()) {
    fragments.push(`【自定义上下文】\n${customContext.trim()}`);
  }

  return fragments.join('\n\n');
}