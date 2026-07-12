import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { buildContext } from './ai';
import { loadState, saveState } from './storage';
import { createInitialState, uid } from './utils';
import type { AiProvider, AiSettings, AppState, Chapter, CharacterCard, ChatMessage, ChapterSnapshot, Work } from './types';

export type SearchResult = {
  chapterId: string;
  chapterTitle: string;
  lineNumber: number;
  lineContent: string;
};

export function searchChapters(chapters: Chapter[], query: string): SearchResult[] {
  if (!query.trim()) return [];
  const lower = query.toLowerCase();
  const results: SearchResult[] = [];

  for (const chapter of chapters) {
    const lines = chapter.content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().includes(lower)) {
        results.push({
          chapterId: chapter.id,
          chapterTitle: chapter.title,
          lineNumber: i + 1,
          lineContent: lines[i].trim(),
        });
      }
    }
  }

  return results;
}

export function highlightMatch(text: string, query: string): string {
  if (!query.trim()) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(
    new RegExp(`(${escaped})`, 'gi'),
    '<mark>$1</mark>',
  );
}

export function useWriterState() {
  const [state, setState] = useState<AppState>(() => loadState() ?? createInitialState());
  const [saveStatus, setSaveStatus] = useState('已就绪');
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const lastActiveChapterIdRef = useRef(state.work.activeChapterId);

  const activeChapter = useMemo(
    () => state.work.chapters.find((chapter) => chapter.id === state.work.activeChapterId) ?? state.work.chapters[0] ?? null,
    [state.work.activeChapterId, state.work.chapters],
  );

  // Debounced auto-save
  useEffect(() => {
    setSaveStatus('保存中...');
    const timer = window.setTimeout(() => {
      saveState(state);
      setSaveStatus(`已自动保存 ${new Date().toLocaleTimeString('zh-CN', { hour12: false })}`);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [state]);

  // Save on page close
  useEffect(() => {
    const handleBeforeUnload = () => saveState(state);
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [state]);

  // Sync context selection only when active chapter actually changes
  useEffect(() => {
    const prevId = lastActiveChapterIdRef.current;
    const currentId = state.work.activeChapterId;
    if (prevId === currentId) return;
    lastActiveChapterIdRef.current = currentId;

    // Reset context to new active chapter only if previous selection was just one chapter
    setState((current) => {
      if (current.selectedContextChapterIds.length === 1 && current.selectedContextChapterIds[0] === prevId) {
        return { ...current, selectedContextChapterIds: [currentId] };
      }
      // User had multi-selected, keep their selection but ensure new chapter is included
      if (!current.selectedContextChapterIds.includes(currentId)) {
        return { ...current, selectedContextChapterIds: [...current.selectedContextChapterIds, currentId] };
      }
      return current;
    });
  }, [state.work.activeChapterId]);

  // Memoized context preview
  const contextPreview = useMemo(
    () => buildContext(state.work.chapters, state.selectedContextChapterIds, state.customContext),
    [state.work.chapters, state.selectedContextChapterIds, state.customContext],
  );

  const selectedContextTitles = useMemo(
    () => state.work.chapters
      .filter((chapter) => state.selectedContextChapterIds.includes(chapter.id))
      .map((chapter) => chapter.title),
    [state.work.chapters, state.selectedContextChapterIds],
  );

  // --- Search ---
  useEffect(() => {
    const results = searchChapters(state.work.chapters, searchQuery);
    setSearchResults(results);
  }, [searchQuery, state.work.chapters]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setShowSearch(true);
  }, []);

  const goToSearchResult = useCallback((chapterId: string) => {
    setState((current) => ({
      ...current,
      work: { ...current.work, activeChapterId: chapterId },
      selectedContextChapterIds: [chapterId],
    }));
  }, []);

  // --- Chapter operations ---
  function updateWork(updater: (work: Work) => Work) {
    setState((current) => ({
      ...current,
      work: updater(current.work),
    }));
  }

  const addNextChapter = useCallback(() => {
    setState((current) => {
      const activeIndex = current.work.chapters.findIndex((chapter) => chapter.id === current.work.activeChapterId);
      const nextChapterNumber = activeIndex >= 0 ? activeIndex + 2 : current.work.chapters.length + 1;
      const chapter: Chapter = {
        id: uid(),
        title: `第${nextChapterNumber}章`,
        content: '',
        updatedAt: Date.now(),
      };

      return {
        ...current,
        work: {
          ...current.work,
          chapters:
            activeIndex >= 0
              ? [...current.work.chapters.slice(0, activeIndex + 1), chapter, ...current.work.chapters.slice(activeIndex + 1)]
              : [...current.work.chapters, chapter],
          activeChapterId: chapter.id,
        },
        selectedContextChapterIds: [chapter.id],
      };
    });
  }, []);

  const goToChapter = useCallback((chapterId: string) => {
    setState((current) => ({
      ...current,
      work: { ...current.work, activeChapterId: chapterId },
      selectedContextChapterIds: [chapterId],
    }));
  }, []);

  const goToPreviousChapter = useCallback(() => {
    setState((current) => {
      const activeIndex = current.work.chapters.findIndex((chapter) => chapter.id === current.work.activeChapterId);
      if (activeIndex <= 0) return current;
      const targetId = current.work.chapters[activeIndex - 1].id;
      return {
        ...current,
        work: { ...current.work, activeChapterId: targetId },
        selectedContextChapterIds: [targetId],
      };
    });
  }, []);

  const goToNextChapter = useCallback(() => {
    setState((current) => {
      const activeIndex = current.work.chapters.findIndex((chapter) => chapter.id === current.work.activeChapterId);
      if (activeIndex < 0 || activeIndex >= current.work.chapters.length - 1) {
        const nextChapterNumber = activeIndex >= 0 ? activeIndex + 2 : current.work.chapters.length + 1;
        const chapter: Chapter = {
          id: uid(),
          title: `第${nextChapterNumber}章`,
          content: '',
          updatedAt: Date.now(),
        };
        return {
          ...current,
          work: {
            ...current.work,
            chapters: [...current.work.chapters, chapter],
            activeChapterId: chapter.id,
          },
          selectedContextChapterIds: [chapter.id],
        };
      }
      const targetId = current.work.chapters[activeIndex + 1].id;
      return {
        ...current,
        work: { ...current.work, activeChapterId: targetId },
        selectedContextChapterIds: [targetId],
      };
    });
  }, []);

  const renameChapter = useCallback((chapterId: string, title: string) => {
    updateWork((work) => ({
      ...work,
      chapters: work.chapters.map((chapter) =>
        chapter.id === chapterId ? { ...chapter, title, updatedAt: Date.now() } : chapter,
      ),
    }));
  }, []);

  const deleteChapter = useCallback((chapterId: string) => {
    setState((current) => {
      if (current.work.chapters.length <= 1) return current;
      const nextChapters = current.work.chapters.filter((chapter) => chapter.id !== chapterId);
      const nextActive = current.work.activeChapterId === chapterId ? nextChapters[0].id : current.work.activeChapterId;
      return {
        ...current,
        work: { ...current.work, chapters: nextChapters, activeChapterId: nextActive },
        selectedContextChapterIds: current.selectedContextChapterIds.filter((id) => id !== chapterId),
      };
    });
  }, []);

  const updateActiveChapterContent = useCallback((content: string) => {
    updateWork((work) => ({
      ...work,
      chapters: work.chapters.map((chapter) =>
        chapter.id === work.activeChapterId ? { ...chapter, content, updatedAt: Date.now() } : chapter,
      ),
    }));
  }, []);

  // --- Settings ---
  const updateSettings = useCallback((patch: Partial<AiSettings>) => {
    setState((current) => {
      const nextState = {
        ...current,
        aiProfiles: {
          ...current.aiProfiles,
          [current.aiProvider]: {
            ...current.aiProfiles[current.aiProvider],
            ...patch,
          },
        },
      };
      saveState(nextState);
      return nextState;
    });
  }, []);

  const setProvider = useCallback((provider: AiProvider) => {
    setState((current) => {
      const nextState = { ...current, aiProvider: provider };
      saveState(nextState);
      return nextState;
    });
  }, []);

  const toggleContextChapter = useCallback((chapterId: string) => {
    setState((current) => {
      const selected = current.selectedContextChapterIds.includes(chapterId)
        ? current.selectedContextChapterIds.filter((id) => id !== chapterId)
        : [...current.selectedContextChapterIds, chapterId];
      return { ...current, selectedContextChapterIds: selected };
    });
  }, []);

  const updateWorkMeta = useCallback((field: 'title' | 'description', value: string) => {
    setState((current) => ({
      ...current,
      work: { ...current.work, [field]: value },
    }));
  }, []);

  const updateCustomContext = useCallback((value: string) => {
    setState((current) => ({ ...current, customContext: value }));
  }, []);

  const updateDraftQuestion = useCallback((value: string) => {
    setState((current) => ({ ...current, draftQuestion: value }));
  }, []);

  const updateHistoryLength = useCallback((value: number) => {
    setState((current) => ({ ...current, historyLength: Math.max(0, Math.min(50, value)) }));
  }, []);

  const clearChat = useCallback(() => {
    setState((current) => ({ ...current, chat: [] }));
  }, []);

  // --- Character Cards ---
  const addCharacterCard = useCallback((name: string, type: CharacterCard['type'], content: string) => {
    const card: CharacterCard = {
      id: uid(),
      name,
      type,
      content,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setState((current) => ({
      ...current,
      characterCards: [...current.characterCards, card],
    }));
  }, []);

  const updateCharacterCard = useCallback((id: string, patch: Partial<Pick<CharacterCard, 'name' | 'type' | 'content'>>) => {
    setState((current) => ({
      ...current,
      characterCards: current.characterCards.map((card) =>
        card.id === id ? { ...card, ...patch, updatedAt: Date.now() } : card,
      ),
    }));
  }, []);

  const deleteCharacterCard = useCallback((id: string) => {
    setState((current) => ({
      ...current,
      characterCards: current.characterCards.filter((card) => card.id !== id),
    }));
  }, []);

  // --- AI Summary ---
  const updateChapterSummary = useCallback((chapterId: string, summary: string) => {
    setState((current) => ({
      ...current,
      chapterSummaries: { ...current.chapterSummaries, [chapterId]: summary },
    }));
  }, []);

  // --- Chapter Snapshots ---
  const createSnapshot = useCallback((chapterId: string) => {
    const chapter = state.work.chapters.find((c) => c.id === chapterId);
    if (!chapter) return;

    const snapshot: ChapterSnapshot = {
      id: uid(),
      chapterId,
      title: chapter.title,
      content: chapter.content,
      createdAt: Date.now(),
    };

    setState((current) => ({
      ...current,
      chapterSnapshots: [...current.chapterSnapshots, snapshot],
    }));
  }, [state.work.chapters]);

  const restoreSnapshot = useCallback((snapshotId: string) => {
    const snapshot = state.chapterSnapshots.find((s) => s.id === snapshotId);
    if (!snapshot) return;

    setState((current) => ({
      ...current,
      work: {
        ...current.work,
        chapters: current.work.chapters.map((chapter) =>
          chapter.id === snapshot.chapterId
            ? { ...chapter, content: snapshot.content, updatedAt: Date.now() }
            : chapter,
        ),
      },
    }));
  }, [state.chapterSnapshots]);

  const deleteSnapshot = useCallback((snapshotId: string) => {
    setState((current) => ({
      ...current,
      chapterSnapshots: current.chapterSnapshots.filter((s) => s.id !== snapshotId),
    }));
  }, []);

  const activeChapterSnapshots = useMemo(
    () => state.chapterSnapshots
      .filter((s) => s.chapterId === state.work.activeChapterId)
      .sort((a, b) => b.createdAt - a.createdAt),
    [state.chapterSnapshots, state.work.activeChapterId],
  );

  // --- AI Chat ---
  const submitQuestion = useCallback(async () => {
    if (!state.draftQuestion.trim() || sending) return;

    const userMessage: ChatMessage = {
      id: uid(),
      role: 'user',
      content: state.draftQuestion.trim(),
      createdAt: Date.now(),
    };

    const nextChat = [...state.chat, userMessage];
    const assistantId = uid();
    const assistantMessage: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      createdAt: Date.now(),
    };

    setState((current) => ({
      ...current,
      chat: [...nextChat, assistantMessage],
      draftQuestion: '',
    }));
    setSending(true);

    try {
      const contextText = buildContext(state.work.chapters, state.selectedContextChapterIds, state.customContext);
      const response = await fetch('http://localhost:8787/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...state.aiProfiles[state.aiProvider],
          provider: state.aiProvider,
          contextText,
          question: userMessage.content,
          history: nextChat.slice(-(state.historyLength || 6)),
        }),
      });

      if (!response.ok) {
        throw new Error(`代理服务返回 ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('无法读取响应流');

      const decoder = new TextDecoder();
      let buffer = '';
      let finalContent = '';
      let finalWarning = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          let parsed;

          if (String(state.aiProvider).trim() === 'ollama') {
            try {
              parsed = JSON.parse(trimmed);
            } catch {
              continue;
            }
            const chunk = parsed?.message?.content || '';
            if (chunk) {
              finalContent += chunk;
              finalWarning = parsed.warning || finalWarning;
              const content = finalWarning
                ? `${finalContent}\n\n【提示】${finalWarning}`
                : finalContent;
              setState((current) => ({
                ...current,
                chat: current.chat.map((msg) =>
                  msg.id === assistantId ? { ...msg, content } : msg,
                ),
              }));
            }
          } else {
            if (!trimmed.startsWith('data:')) continue;
            const data = trimmed.slice(5).trim();
            if (data === '[DONE]') continue;

            try {
              parsed = JSON.parse(data);
            } catch {
              continue;
            }
            const chunk = parsed?.choices?.[0]?.delta?.content || '';
            if (chunk) {
              finalContent += chunk;
              finalWarning = parsed.warning || finalWarning;
              const content = finalWarning
                ? `${finalContent}\n\n【提示】${finalWarning}`
                : finalContent;
              setState((current) => ({
                ...current,
                chat: current.chat.map((msg) =>
                  msg.id === assistantId ? { ...msg, content } : msg,
                ),
              }));
            }
          }
        }
      }

      if (!finalContent) {
        setState((current) => ({
          ...current,
          chat: current.chat.map((msg) =>
            msg.id === assistantId ? { ...msg, content: 'AI 返回内容为空' } : msg,
          ),
        }));
      }
    } catch (error) {
      setState((current) => ({
        ...current,
        chat: current.chat.map((msg) =>
          msg.id === assistantId
            ? { ...msg, content: error instanceof Error ? error.message : 'AI 调用失败' }
            : msg,
        ),
      }));
    } finally {
      setSending(false);
    }
  }, [state, sending]);

  // --- Export / Import ---
  const exportData = useCallback(() => {
    const exportPayload = {
      ...state,
      chat: [],
      draftQuestion: '',
      aiProfiles: {
        ollama: { ...state.aiProfiles.ollama, apiKey: '' },
        openai: { ...state.aiProfiles.openai, apiKey: '' },
      },
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.work.title || '写作数据'}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setSaveStatus('已导出');
  }, [state]);

  const importData = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const raw = JSON.parse(text);
        if (!raw.work || !raw.work.chapters) {
          alert('文件格式不正确：缺少 work.chapters 数据');
          return;
        }
        const newState: AppState = {
          ...createInitialState(),
          ...raw,
          aiProfiles: raw.aiProfiles || createInitialState().aiProfiles,
          chat: [],
          draftQuestion: raw.draftQuestion || '',
        };
        setState(newState);
        saveState(newState);
        setSaveStatus('已导入');
      } catch {
        alert('导入失败：文件无法解析');
      }
    };
    input.click();
  }, []);

  const currentAiSettings = state.aiProfiles[state.aiProvider];

  return {
    state,
    saveStatus,
    sending,
    activeChapter,
    contextPreview,
    selectedContextTitles,
    currentAiSettings,
    // Search
    searchQuery,
    searchResults,
    showSearch,
    handleSearch,
    goToSearchResult,
    setShowSearch,
    // Chapter
    addNextChapter,
    goToChapter,
    goToPreviousChapter,
    goToNextChapter,
    renameChapter,
    deleteChapter,
    updateActiveChapterContent,
    // Settings
    updateSettings,
    setProvider,
    toggleContextChapter,
    updateWorkMeta,
    updateCustomContext,
    updateDraftQuestion,
    updateHistoryLength,
    clearChat,
    // Character Cards
    addCharacterCard,
    updateCharacterCard,
    deleteCharacterCard,
    // AI Summary
    updateChapterSummary,
    // Snapshots
    createSnapshot,
    restoreSnapshot,
    deleteSnapshot,
    activeChapterSnapshots,
    // Chat
    submitQuestion,
    // Export/Import
    exportData,
    importData,
  };
}