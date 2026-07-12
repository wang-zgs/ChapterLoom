export type Chapter = {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
};

export type Work = {
  id: string;
  title: string;
  description: string;
  chapters: Chapter[];
  activeChapterId: string;
};

export type AiSettings = {
  endpoint: string;
  apiKey: string;
  model: string;
  systemPrompt: string;
};

export type AiProvider = 'ollama' | 'openai';

export type AiProfiles = Record<AiProvider, AiSettings>;

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
};

export type CharacterCard = {
  id: string;
  name: string;
  type: 'character' | 'setting';
  content: string;
  createdAt: number;
  updatedAt: number;
};

export type ChapterSnapshot = {
  id: string;
  chapterId: string;
  title: string;
  content: string;
  createdAt: number;
};

export type AppState = {
  work: Work;
  aiProvider: AiProvider;
  aiProfiles: AiProfiles;
  selectedContextChapterIds: string[];
  customContext: string;
  chat: ChatMessage[];
  draftQuestion: string;
  historyLength: number;
  characterCards: CharacterCard[];
  chapterSummaries: Record<string, string>;
  chapterSnapshots: ChapterSnapshot[];
};