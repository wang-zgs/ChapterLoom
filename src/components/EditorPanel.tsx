import React, { useState } from 'react';
import type { Chapter } from '../types';
import { formatTime } from '../utils';
import { highlightMatch } from '../useWriterState';
import type { SearchResult } from '../useWriterState';

type TopbarProps = {
  saveStatus: string;
  wordCount: number;
  onOpenSettings: () => void;
  onExport: () => void;
  onImport: () => void;
  onToggleSearch: () => void;
  showSearch: boolean;
};

export function Topbar({ saveStatus, wordCount, onOpenSettings, onExport, onImport, onToggleSearch, showSearch }: TopbarProps) {
  return (
    <header className="topbar">
      <div>
        <div className="brand inline-brand">
          <div className="brand-mark">写</div>
          <div>
            <h1>写作码字 MVP</h1>
            <p>本地保存 + AI 上下文</p>
          </div>
        </div>
      </div>
      <div className="toolbar">
        <div className="status-box compact-status">
          <span>{saveStatus}</span>
          <span>{wordCount} 字</span>
        </div>
        <button type="button" className={`ghost ${showSearch ? 'active' : ''}`} onClick={onToggleSearch}>
          搜索
        </button>
        <button type="button" className="ghost" onClick={onExport}>
          导出
        </button>
        <button type="button" className="ghost" onClick={onImport}>
          导入
        </button>
        <button type="button" className="ghost" onClick={onOpenSettings}>
          设置
        </button>
      </div>
    </header>
  );
}

type SearchPanelProps = {
  searchQuery: string;
  searchResults: SearchResult[];
  onSearch: (query: string) => void;
  onGoToResult: (chapterId: string) => void;
  onClose: () => void;
};

export function SearchPanel({ searchQuery, searchResults, onSearch, onGoToResult, onClose }: SearchPanelProps) {
  const [localQuery, setLocalQuery] = useState(searchQuery);

  return (
    <div className="search-panel">
      <div className="search-header">
        <input
          className="search-input"
          value={localQuery}
          onChange={(e) => {
            setLocalQuery(e.target.value);
            onSearch(e.target.value);
          }}
          placeholder="搜索全部章节内容..."
          autoFocus
        />
        <button type="button" className="ghost" onClick={onClose}>
          关闭
        </button>
      </div>
      {localQuery.trim() && (
        <div className="search-results">
          <div className="search-count">找到 {searchResults.length} 条结果</div>
          {searchResults.length === 0 ? (
            <div className="search-empty">没有找到匹配内容</div>
          ) : (
            <ul className="search-result-list">
              {searchResults.map((r, i) => (
                <li key={`${r.chapterId}-${r.lineNumber}-${i}`}>
                  <button
                    type="button"
                    className="search-result-item"
                    onClick={() => onGoToResult(r.chapterId)}
                  >
                    <span className="search-result-chapter">{r.chapterTitle}</span>
                    <span className="search-result-line">第 {r.lineNumber} 行</span>
                    <span
                      className="search-result-text"
                      dangerouslySetInnerHTML={{ __html: highlightMatch(r.lineContent, localQuery) }}
                    />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

type ChapterItemProps = {
  chapter: Chapter;
  active: boolean;
  onSelect: () => void;
  onRename: (title: string) => void;
  onDelete: () => void;
};

function ChapterItem({ chapter, active, onSelect, onRename, onDelete }: ChapterItemProps) {
  return (
    <button
      type="button"
      className={`chapter-item ${active ? 'active' : ''}`}
      onClick={onSelect}
    >
      <input
        value={chapter.title}
        onChange={(event) => onRename(event.target.value)}
        onClick={(event) => event.stopPropagation()}
      />
      <span>{chapter.content.trim() ? `${chapter.content.length} 字` : '未写'}</span>
      <small>{formatTime(chapter.updatedAt)}</small>
      <span
        className="delete"
        role="button"
        tabIndex={0}
        onClick={(event) => {
          event.stopPropagation();
          onDelete();
        }}
      >
        删除
      </span>
    </button>
  );
}

type EditorPanelProps = {
  workTitle: string;
  workDescription: string;
  chapters: Chapter[];
  activeChapterId: string;
  activeChapterTitle: string;
  activeChapterContent: string;
  onWorkTitleChange: (value: string) => void;
  onWorkDescriptionChange: (value: string) => void;
  onGoToChapter: (id: string) => void;
  onGoToPreviousChapter: () => void;
  onGoToNextChapter: () => void;
  onAddNextChapter: () => void;
  onRenameChapter: (id: string, title: string) => void;
  onDeleteChapter: (id: string) => void;
  onUpdateContent: (content: string) => void;
  onRenameActiveChapter: (title: string) => void;
};

export function EditorPanel({
  workTitle,
  workDescription,
  chapters,
  activeChapterId,
  activeChapterTitle,
  activeChapterContent,
  onWorkTitleChange,
  onWorkDescriptionChange,
  onGoToChapter,
  onGoToPreviousChapter,
  onGoToNextChapter,
  onAddNextChapter,
  onRenameChapter,
  onDeleteChapter,
  onUpdateContent,
  onRenameActiveChapter,
}: EditorPanelProps) {
  return (
    <section className="editor-panel main-editor">
      <div className="project-row">
        <label className="field">
          <span>作品标题</span>
          <input
            value={workTitle}
            onChange={(event) => onWorkTitleChange(event.target.value)}
          />
        </label>
        <label className="field">
          <span>作品简介</span>
          <textarea
            rows={3}
            value={workDescription}
            onChange={(event) => onWorkDescriptionChange(event.target.value)}
          />
        </label>
      </div>

      <div className="chapter-controls">
        <div>
          <h2>章节</h2>
          <p>用上一章 / 下一章在章节之间快速切换</p>
        </div>
        <div className="chapter-nav-row">
          <button type="button" className="ghost" onClick={onGoToPreviousChapter}>
            上一章
          </button>
          <button type="button" className="ghost" onClick={onGoToNextChapter}>
            下一章
          </button>
        </div>
      </div>

      <div className="chapter-list horizontal-list">
        {chapters.map((chapter) => (
          <ChapterItem
            key={chapter.id}
            chapter={chapter}
            active={chapter.id === activeChapterId}
            onSelect={() => onGoToChapter(chapter.id)}
            onRename={(title) => onRenameChapter(chapter.id, title)}
            onDelete={() => onDeleteChapter(chapter.id)}
          />
        ))}
      </div>

      <div className="section-head">
        <h2>写作区</h2>
        <div className="write-toolbar">
          <span className="hint">章节：{activeChapterTitle || '未选择'}</span>
          <button type="button" className="primary next-chapter-button" onClick={onAddNextChapter}>
            下一章
          </button>
        </div>
      </div>

      <label className="field">
        <span>章节标题</span>
        <input
          value={activeChapterTitle}
          onChange={(event) => onRenameActiveChapter(event.target.value)}
        />
      </label>

      <label className="field editor-field">
        <span>正文</span>
        <textarea
          value={activeChapterContent}
          onChange={(event) => onUpdateContent(event.target.value)}
          placeholder="开始写作..."
        />
      </label>
    </section>
  );
}