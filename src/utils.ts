import type { AppState, Chapter, Work } from './types';

export function uid() {
  return crypto.randomUUID();
}

export function formatTime(ts: number) {
  return new Date(ts).toLocaleString('zh-CN', { hour12: false });
}

export function createDefaultWork(): Work {
  const chapter: Chapter = {
    id: uid(),
    title: '第一章',
    content: '在这里开始写下你的故事。\n\n你可以随时切换章节，AI 也能读取你选中的章节内容。',
    updatedAt: Date.now(),
  };

  return {
    id: uid(),
    title: '新作品',
    description: '第一期 MVP：写作、自动保存、AI 上下文。',
    chapters: [chapter],
    activeChapterId: chapter.id,
  };
}

export function createInitialState(): AppState {
  const work = createDefaultWork();

  return {
    work,
    aiProvider: 'ollama',
    aiProfiles: {
      ollama: {
        endpoint: 'http://localhost:11434',
        apiKey: '',
        model: 'qwen3.6:27b',
        systemPrompt: '你是一个中文网文写作助手，回答要具体、可执行。',
      },
      openai: {
        endpoint: 'https://api.openai.com/v1/chat/completions',
        apiKey: '',
        model: 'gpt-4o-mini',
        systemPrompt: '你是一个中文网文写作助手，回答要具体、可执行。',
      },
    },
    selectedContextChapterIds: [work.activeChapterId],
    customContext: '',
    chat: [],
    draftQuestion: '请根据这些章节设定，帮我分析人物动机是否合理。',
    historyLength: 6,
    characterCards: [],
    chapterSummaries: {},
    chapterSnapshots: [],
  };
}