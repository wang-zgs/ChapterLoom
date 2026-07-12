import type { AiProvider, AppState } from './types';
import { createEmptyProfile, createInitialState } from './utils';

const STORAGE_KEY = 'write-mvp-state-v1';

function normalizeState(raw: unknown): AppState | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const state = raw as Record<string, unknown>;

  // Validate required fields
  if (!state.work || typeof state.work !== 'object') {
    return null;
  }

  const work = state.work as AppState['work'];
  if (!Array.isArray(work.chapters) || work.chapters.length === 0) {
    return null;
  }

  const baseState = createInitialState();
  const legacySettings = state.aiSettings as Record<string, unknown> | undefined;
  const profiles = state.aiProfiles as Record<string, Record<string, unknown>> | undefined;
  const aiProvider: AiProvider = state.aiProvider === 'openai' ? 'openai' : 'ollama';

  // Extract and validate each field individually
  const selectedContextChapterIds = Array.isArray(state.selectedContextChapterIds)
    ? (state.selectedContextChapterIds as string[]).filter((id) => typeof id === 'string')
    : baseState.selectedContextChapterIds;
  const customContext = typeof state.customContext === 'string' ? state.customContext : baseState.customContext;
  const chat = Array.isArray(state.chat) ? (state.chat as AppState['chat']) : baseState.chat;
  const draftQuestion = typeof state.draftQuestion === 'string' ? state.draftQuestion : baseState.draftQuestion;
  const historyLength = typeof state.historyLength === 'number' ? state.historyLength : baseState.historyLength;

  const characterCards = Array.isArray(state.characterCards)
    ? (state.characterCards as AppState['characterCards'])
    : baseState.characterCards;

  const chapterSummaries = state.chapterSummaries && typeof state.chapterSummaries === 'object' && !Array.isArray(state.chapterSummaries)
    ? (state.chapterSummaries as Record<string, string>)
    : baseState.chapterSummaries;

  const chapterSnapshots = Array.isArray(state.chapterSnapshots)
    ? (state.chapterSnapshots as AppState['chapterSnapshots'])
    : baseState.chapterSnapshots;

  // Rebuild aiProfiles safely
  let aiProfiles = baseState.aiProfiles;
  if (profiles) {
    aiProfiles = {
      ollama: { ...createEmptyProfile('ollama'), ...profiles.ollama },
      openai: { ...createEmptyProfile('openai'), ...profiles.openai },
    };
  } else if (legacySettings) {
    const endpoint = String(legacySettings.endpoint || '');
    const inferredProvider: AiProvider = endpoint.includes('localhost:11434') ? 'ollama' : 'openai';
    aiProfiles = {
      ollama: createEmptyProfile('ollama'),
      openai: { ...createEmptyProfile('openai'), ...(inferredProvider === 'openai' ? legacySettings : {}) },
    };
  }

  return {
    work,
    aiProvider,
    aiProfiles,
    selectedContextChapterIds,
    customContext,
    chat,
    draftQuestion,
    historyLength,
    characterCards,
    chapterSummaries,
    chapterSnapshots,
  };
}

// Migration: fix known bad defaults in stored data
export function loadState(): AppState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const state = normalizeState(JSON.parse(raw));
    if (!state) return null;

    // Migrate qwen2.5:7b (non-existent) to qwen3.6:27b
    let migrated = false;
    if (state.aiProfiles.ollama.model === 'qwen2.5:7b') {
      state.aiProfiles.ollama.model = 'qwen3.6:27b';
      migrated = true;
    }
    if (migrated) {
      saveState(state);
    }

    return state;
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