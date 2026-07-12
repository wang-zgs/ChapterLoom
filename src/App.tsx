import { useCallback, useState } from 'react';
import { Topbar, EditorPanel, SearchPanel } from './components/EditorPanel';
import { ChatPanel } from './components/ChatPanel';
import { SettingsModal } from './components/SettingsModal';
import { useWriterState } from './useWriterState';

export default function App() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const {
    state,
    saveStatus,
    sending,
    activeChapter,
    contextPreview,
    selectedContextTitles,
    currentAiSettings,
    searchQuery,
    searchResults,
    showSearch,
    handleSearch,
    goToSearchResult,
    setShowSearch,
    goToPreviousChapter,
    goToNextChapter,
    addNextChapter,
    goToChapter,
    renameChapter,
    deleteChapter,
    updateActiveChapterContent,
    updateSettings,
    setProvider,
    toggleContextChapter,
    updateWorkMeta,
    updateCustomContext,
    updateDraftQuestion,
    updateHistoryLength,
    clearChat,
    addCharacterCard,
    updateCharacterCard,
    deleteCharacterCard,
    updateChapterSummary,
    createSnapshot,
    restoreSnapshot,
    deleteSnapshot,
    submitQuestion,
    exportData,
    importData,
  } = useWriterState();

  // Include character cards into custom context
  const includeCardsInContext = useCallback(() => {
    const cards = state.characterCards;
    if (!cards.length) return;

    const fragments = cards.map((card) => {
      const typeLabel = card.type === 'character' ? '人物' : '设定';
      return `【${typeLabel}】${card.name}\n${card.content}`;
    });

    // Also include chapter summaries
    const summaryFragments = state.work.chapters
      .filter((ch) => state.chapterSummaries[ch.id])
      .map((ch) => `【章节摘要】${ch.title}\n${state.chapterSummaries[ch.id]}`);

    const combined = [...fragments, ...summaryFragments].join('\n\n');
    updateCustomContext(state.customContext ? `${state.customContext}\n\n${combined}` : combined);
    setSettingsOpen(false);
  }, [state.characterCards, state.chapterSummaries, state.customContext, updateCustomContext]);

  return (
    <div className="shell">
      <main className="main writer-layout">
        <Topbar
          saveStatus={saveStatus}
          wordCount={activeChapter?.content.length ?? 0}
          onOpenSettings={() => setSettingsOpen(true)}
          onExport={exportData}
          onImport={importData}
          onToggleSearch={() => setShowSearch((prev) => !prev)}
          showSearch={showSearch}
        />

        {showSearch && (
          <SearchPanel
            searchQuery={searchQuery}
            searchResults={searchResults}
            onSearch={handleSearch}
            onGoToResult={goToSearchResult}
            onClose={() => setShowSearch(false)}
          />
        )}

        <EditorPanel
          workTitle={state.work.title}
          workDescription={state.work.description}
          chapters={state.work.chapters}
          activeChapterId={state.work.activeChapterId}
          activeChapterTitle={activeChapter?.title ?? ''}
          activeChapterContent={activeChapter?.content ?? ''}
          onWorkTitleChange={(v) => updateWorkMeta('title', v)}
          onWorkDescriptionChange={(v) => updateWorkMeta('description', v)}
          onGoToChapter={goToChapter}
          onGoToPreviousChapter={goToPreviousChapter}
          onGoToNextChapter={goToNextChapter}
          onAddNextChapter={addNextChapter}
          onRenameChapter={renameChapter}
          onDeleteChapter={deleteChapter}
          onUpdateContent={updateActiveChapterContent}
          onRenameActiveChapter={(title) => activeChapter && renameChapter(activeChapter.id, title)}
        />

        <ChatPanel
          chat={state.chat}
          draftQuestion={state.draftQuestion}
          sending={sending}
          selectedContextTitles={selectedContextTitles}
          onDraftQuestionChange={updateDraftQuestion}
          onSubmit={submitQuestion}
          onClear={clearChat}
        />

        <SettingsModal
          open={settingsOpen}
          aiProvider={state.aiProvider}
          currentAiSettings={currentAiSettings}
          chapters={state.work.chapters}
          selectedContextChapterIds={state.selectedContextChapterIds}
          customContext={state.customContext}
          contextPreview={contextPreview}
          historyLength={state.historyLength || 6}
          characterCards={state.characterCards}
          chapterSummaries={state.chapterSummaries}
          chapterSnapshots={state.chapterSnapshots}
          activeChapterId={state.work.activeChapterId}
          activeChapterTitle={activeChapter?.title ?? ''}
          activeChapterContent={activeChapter?.content ?? ''}
          onClose={() => setSettingsOpen(false)}
          onSetProvider={setProvider}
          onUpdateSettings={updateSettings}
          onToggleContextChapter={toggleContextChapter}
          onUpdateCustomContext={updateCustomContext}
          onUpdateHistoryLength={updateHistoryLength}
          onAddCharacterCard={addCharacterCard}
          onUpdateCharacterCard={updateCharacterCard}
          onDeleteCharacterCard={deleteCharacterCard}
          onUpdateChapterSummary={updateChapterSummary}
          onCreateSnapshot={createSnapshot}
          onRestoreSnapshot={restoreSnapshot}
          onDeleteSnapshot={deleteSnapshot}
          onIncludeCardsInContext={includeCardsInContext}
        />
      </main>
    </div>
  );
}