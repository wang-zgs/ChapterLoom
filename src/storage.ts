import type { AiProvider, AppState } from './types';

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

  const state = raw as Record<string, unknown>;
  const legacySettings = state.aiSettings as Record<string, unknown> | undefined;
  const profiles = state.aiProfiles as Record<string, Record<string, unknown>> | undefined;
  const aiProvider = state.aiProvider === 'openai' ? 'openai' : 'ollama';

  if (state.work && profiles && state.selectedContextChapterIds && state.chat && state.draftQuestion !== undefined) {
    return {
      ...state,
      aiProvider,
      historyLength: state.historyLength ?? 6,
      characterCards: state.characterCards ?? [],
      chapterSummaries: state.chapterSummaries ?? {},
      chapterSnapshots: state.chapterSnapshots ?? [],
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
      ...state,
      aiProvider: inferredProvider,
      historyLength: 6,
      characterCards: [],
      chapterSummaries: {},
      chapterSnapshots: [],
      aiProfiles: {
        ollama: createEmptyProfile('ollama'),
        openai: createEmptyProfile('openai'),
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