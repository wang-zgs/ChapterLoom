import type { AiProvider, AppState } from './types';
import { createInitialState } from './utils';

const STORAGE_KEY = 'write-mvp-state-v1';

function createEmptyProfile(provider: AiProvider) {
  return provider === 'ollama'
    ? {
        endpoint: 'http://localhost:11434',
        apiKey: '',
        model: 'qwen3.6:27b',
        systemPrompt: '你是一个中文网文写作助手，回答要具体、可执行。',
      }
    : {
        endpoint: 'https://api.openai.com/v1/chat/completions',
        apiKey: '',
        model: 'gpt-4o-mini',
        systemPrompt: '你是一个中文网文写作助手，回答要具体、可执行。',
      };
}

function normalizeState(raw: unknown): AppState | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const baseState = createInitialState();
  const state = raw as Record<string, unknown>;
  const legacySettings = state.aiSettings as Record<string, unknown> | undefined;
  const profiles = state.aiProfiles as Record<string, Record<string, unknown>> | undefined;
  const aiProvider = state.aiProvider === 'openai' ? 'openai' : 'ollama';

  const work = state.work && typeof state.work === 'object' ? (state.work as AppState['work']) : baseState.work;
  const selectedContextChapterIds = Array.isArray(state.selectedContextChapterIds)
    ? (state.selectedContextChapterIds as string[])
    : baseState.selectedContextChapterIds;
  const customContext = typeof state.customContext === 'string' ? state.customContext : baseState.customContext;
  const chat = Array.isArray(state.chat) ? (state.chat as AppState['chat']) : baseState.chat;
  const draftQuestion = typeof state.draftQuestion === 'string' ? state.draftQuestion : baseState.draftQuestion;
  const historyLength = typeof state.historyLength === 'number' ? state.historyLength : baseState.historyLength;
  const characterCards = Array.isArray(state.characterCards) ? (state.characterCards as AppState['characterCards']) : baseState.characterCards;
  const chapterSummaries = state.chapterSummaries && typeof state.chapterSummaries === 'object'
    ? (state.chapterSummaries as AppState['chapterSummaries'])
    : baseState.chapterSummaries;
  const chapterSnapshots = Array.isArray(state.chapterSnapshots)
    ? (state.chapterSnapshots as AppState['chapterSnapshots'])
    : baseState.chapterSnapshots;

  if (state.work && profiles && state.selectedContextChapterIds && state.chat && state.draftQuestion !== undefined) {
    return {
      ...baseState,
      ...state,
      aiProvider,
      work,
      selectedContextChapterIds,
      customContext,
      chat,
      draftQuestion,
      historyLength,
      characterCards,
      chapterSummaries,
      chapterSnapshots,
      aiProfiles: {
        ollama: {
          ...createEmptyProfile('ollama'),
          ...(profiles.ollama ?? {}),
        },
        openai: {
          ...createEmptyProfile('openai'),
          ...(profiles.openai ?? {}),
        },
      },
    } as AppState;
  }

  if (state.work && legacySettings && state.selectedContextChapterIds && state.chat && state.draftQuestion !== undefined) {
    const endpoint = String(legacySettings.endpoint || '');
    const inferredProvider: AiProvider = endpoint.includes('localhost:11434') ? 'ollama' : 'openai';

    return {
      ...baseState,
      ...state,
      aiProvider: inferredProvider,
      work,
      selectedContextChapterIds,
      customContext,
      chat,
      draftQuestion,
      historyLength,
      characterCards,
      chapterSummaries,
      chapterSnapshots,
      aiProfiles: {
        ollama: createEmptyProfile('ollama'),
        openai: {
          ...createEmptyProfile('openai'),
          ...(inferredProvider === 'openai' ? legacySettings : {}),
        },
      },
    } as AppState;
  }

  return null;
}

export function loadState(): AppState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    return normalizeState(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveState(state: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearState() {
  localStorage.removeItem(STORAGE_KEY);
}