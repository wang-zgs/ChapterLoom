import { useState } from 'react';
import type { AiProvider, AiSettings, Chapter, CharacterCard, ChapterSnapshot } from '../types';
import { formatTime } from '../utils';

type SettingsModalProps = {
  open: boolean;
  aiProvider: AiProvider;
  currentAiSettings: AiSettings;
  chapters: Chapter[];
  selectedContextChapterIds: string[];
  customContext: string;
  contextPreview: string;
  historyLength: number;
  characterCards: CharacterCard[];
  chapterSummaries: Record<string, string>;
  chapterSnapshots: ChapterSnapshot[];
  activeChapterId: string;
  activeChapterTitle: string;
  activeChapterContent: string;
  onClose: () => void;
  onSetProvider: (provider: AiProvider) => void;
  onUpdateSettings: (patch: Partial<AiSettings>) => void;
  onToggleContextChapter: (chapterId: string) => void;
  onUpdateCustomContext: (value: string) => void;
  onUpdateHistoryLength: (value: number) => void;
  onAddCharacterCard: (name: string, type: CharacterCard['type'], content: string) => void;
  onUpdateCharacterCard: (id: string, patch: Partial<Pick<CharacterCard, 'name' | 'type' | 'content'>>) => void;
  onDeleteCharacterCard: (id: string) => void;
  onUpdateChapterSummary: (chapterId: string, summary: string) => void;
  onCreateSnapshot: (chapterId: string) => void;
  onRestoreSnapshot: (snapshotId: string) => void;
  onDeleteSnapshot: (snapshotId: string) => void;
  onIncludeCardsInContext: () => void;
};

type Tab = 'ai' | 'cards' | 'summary' | 'versions';

export function SettingsModal({
  open,
  aiProvider,
  currentAiSettings,
  chapters,
  selectedContextChapterIds,
  customContext,
  contextPreview,
  historyLength,
  characterCards,
  chapterSummaries,
  chapterSnapshots,
  activeChapterId,
  activeChapterTitle,
  activeChapterContent,
  onClose,
  onSetProvider,
  onUpdateSettings,
  onToggleContextChapter,
  onUpdateCustomContext,
  onUpdateHistoryLength,
  onAddCharacterCard,
  onUpdateCharacterCard,
  onDeleteCharacterCard,
  onUpdateChapterSummary,
  onCreateSnapshot,
  onRestoreSnapshot,
  onDeleteSnapshot,
  onIncludeCardsInContext,
}: SettingsModalProps) {
  const [tab, setTab] = useState<Tab>('ai');

  // Character card form state
  const [newCardName, setNewCardName] = useState('');
  const [newCardType, setNewCardType] = useState<CharacterCard['type']>('character');
  const [newCardContent, setNewCardContent] = useState('');
  const [editingCardId, setEditingCardId] = useState<string | null>(null);

  if (!open) return null;

  const handleAddCard = () => {
    if (!newCardName.trim()) return;
    onAddCharacterCard(newCardName.trim(), newCardType, newCardContent.trim());
    setNewCardName('');
    setNewCardContent('');
  };

  const activeSnapshotList = chapterSnapshots
    .filter((s) => s.chapterId === activeChapterId)
    .sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="settings-backdrop" onClick={onClose}>
      <div className="settings-panel" onClick={(event) => event.stopPropagation()}>
        <div className="section-head">
          <h2>设置</h2>
          <button type="button" className="ghost" onClick={onClose}>
            关闭
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="settings-tabs">
          <button type="button" className={`settings-tab ${tab === 'ai' ? 'active' : ''}`} onClick={() => setTab('ai')}>
            AI 配置
          </button>
          <button type="button" className={`settings-tab ${tab === 'cards' ? 'active' : ''}`} onClick={() => setTab('cards')}>
            人物/设定卡
          </button>
          <button type="button" className={`settings-tab ${tab === 'summary' ? 'active' : ''}`} onClick={() => setTab('summary')}>
            AI 摘要
          </button>
          <button type="button" className={`settings-tab ${tab === 'versions' ? 'active' : ''}`} onClick={() => setTab('versions')}>
            历史版本
          </button>
        </div>

        {/* AI Config Tab */}
        {tab === 'ai' && (
          <>
            <div className="provider-switch">
              <button
                type="button"
                className={`provider-chip ${aiProvider === 'ollama' ? 'active' : ''}`}
                onClick={() => onSetProvider('ollama')}
              >
                本地模型
              </button>
              <button
                type="button"
                className={`provider-chip ${aiProvider === 'openai' ? 'active' : ''}`}
                onClick={() => onSetProvider('openai')}
              >
                云端模型
              </button>
            </div>

            <div className="hint provider-hint">
              当前正在编辑 {aiProvider === 'ollama' ? '本地 Ollama' : '云端 OpenAI 兼容'} 配置，切换后会自动保留另一套参数。
            </div>

            <div className="grid two">
              <label className="field">
                <span>API Endpoint</span>
                <input
                  value={currentAiSettings.endpoint}
                  onChange={(event) => onUpdateSettings({ endpoint: event.target.value })}
                  placeholder={aiProvider === 'ollama' ? 'http://localhost:11434' : 'https://api.openai.com/v1/chat/completions'}
                />
              </label>
              <label className="field">
                <span>Model</span>
                <input
                  value={currentAiSettings.model}
                  onChange={(event) => onUpdateSettings({ model: event.target.value })}
                  placeholder="gpt-4o-mini 或 qwen2.5:7b"
                />
              </label>
            </div>

            <label className="field">
              <span>API Key</span>
              <input
                type="password"
                value={currentAiSettings.apiKey}
                onChange={(event) => onUpdateSettings({ apiKey: event.target.value })}
                placeholder={aiProvider === 'ollama' ? 'Ollama 本地模型通常不需要 Key' : '输入密钥后可调用真实 AI'}
              />
              {aiProvider !== 'ollama' && (
                <small className="hint" style={{ marginTop: 2 }}>
                  API Key 仅保存在浏览器本地存储中，不会发送到任何第三方服务器。
                </small>
              )}
            </label>

            <label className="field">
              <span>System Prompt</span>
              <input
                value={currentAiSettings.systemPrompt}
                onChange={(event) => onUpdateSettings({ systemPrompt: event.target.value })}
              />
            </label>

            <label className="field">
              <span>对话历史条数 (0-50)</span>
              <input
                type="number"
                min={0}
                max={50}
                value={historyLength}
                onChange={(event) => onUpdateHistoryLength(Number(event.target.value))}
              />
              <small className="hint">发送给 AI 的最近对话轮数，设为 0 则不发送历史</small>
            </label>

            <div className="section-head spaced-top">
              <h2>AI 上下文章节</h2>
              <span className="hint">可选择任意章节，不限当前章</span>
            </div>

            <div className="context-list settings-context-list">
              {chapters.map((chapter) => (
                <label key={chapter.id} className="context-item">
                  <input
                    type="checkbox"
                    checked={selectedContextChapterIds.includes(chapter.id)}
                    onChange={() => onToggleContextChapter(chapter.id)}
                  />
                  <span>{chapter.title}</span>
                </label>
              ))}
            </div>

            <label className="field">
              <span>自定义上下文</span>
              <textarea
                rows={5}
                value={customContext}
                onChange={(event) => onUpdateCustomContext(event.target.value)}
                placeholder="可粘贴设定、人物关系、写作要求等"
              />
            </label>

            <div className="field muted-box">
              <span>当前上下文预览</span>
              <pre>{contextPreview || '未选择任何上下文'}</pre>
            </div>
          </>
        )}

        {/* Character/Setting Cards Tab */}
        {tab === 'cards' && (
          <>
            <div className="section-head">
              <h2>人物 / 设定卡</h2>
              <button type="button" className="ghost" onClick={onIncludeCardsInContext}>
                全部加入上下文
              </button>
            </div>
            <div className="hint">管理人物档案和世界观设定，可一键注入 AI 对话上下文。</div>

            {/* Existing cards */}
            <div className="card-list">
              {characterCards.length === 0 && (
                <div className="empty-state">尚未创建人物或设定卡</div>
              )}
              {characterCards.map((card) => (
                <div key={card.id} className="character-card">
                  {editingCardId === card.id ? (
                    <>
                      <div className="grid two">
                        <label className="field">
                          <span>名称</span>
                          <input
                            value={card.name}
                            onChange={(e) => onUpdateCharacterCard(card.id, { name: e.target.value })}
                          />
                        </label>
                        <label className="field">
                          <span>类型</span>
                          <select
                            value={card.type}
                            onChange={(e) => onUpdateCharacterCard(card.id, { type: e.target.value as CharacterCard['type'] })}
                          >
                            <option value="character">人物</option>
                            <option value="setting">设定</option>
                          </select>
                        </label>
                      </div>
                      <label className="field">
                        <span>内容</span>
                        <textarea
                          rows={4}
                          value={card.content}
                          onChange={(e) => onUpdateCharacterCard(card.id, { content: e.target.value })}
                        />
                      </label>
                      <div className="action-row">
                        <button type="button" className="primary" onClick={() => setEditingCardId(null)}>
                          完成
                        </button>
                        <button type="button" className="ghost" onClick={() => { setEditingCardId(null); onDeleteCharacterCard(card.id); }}>
                          删除
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="character-card-header">
                        <span className={`card-type-badge ${card.type}`}>
                          {card.type === 'character' ? '人物' : '设定'}
                        </span>
                        <strong>{card.name}</strong>
                        <small>{formatTime(card.updatedAt)}</small>
                      </div>
                      <p className="character-card-content">{card.content || '（空）'}</p>
                      <div className="action-row">
                        <button type="button" className="ghost" onClick={() => setEditingCardId(card.id)}>
                          编辑
                        </button>
                        <button type="button" className="ghost" onClick={() => onDeleteCharacterCard(card.id)}>
                          删除
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Add new card */}
            <div className="section-head spaced-top">
              <h2>新建卡片</h2>
            </div>
            <div className="grid two">
              <label className="field">
                <span>名称</span>
                <input
                  value={newCardName}
                  onChange={(e) => setNewCardName(e.target.value)}
                  placeholder="如：李明、修仙体系"
                />
              </label>
              <label className="field">
                <span>类型</span>
                <select value={newCardType} onChange={(e) => setNewCardType(e.target.value as CharacterCard['type'])}>
                  <option value="character">人物</option>
                  <option value="setting">设定</option>
                </select>
              </label>
            </div>
            <label className="field">
              <span>内容</span>
              <textarea
                rows={4}
                value={newCardContent}
                onChange={(e) => setNewCardContent(e.target.value)}
                placeholder="人物背景、性格、关系；或世界观、力量体系等设定"
              />
            </label>
            <div className="action-row">
              <button type="button" className="primary" onClick={handleAddCard} disabled={!newCardName.trim()}>
                添加卡片
              </button>
            </div>
          </>
        )}

        {/* AI Summary Tab */}
        {tab === 'summary' && (
          <>
            <div className="section-head">
              <h2>AI 章节摘要</h2>
              <span className="hint">记录每章的核心情节，帮助 AI 理解长篇连贯性</span>
            </div>

            {chapters.map((chapter) => (
              <div key={chapter.id} className="summary-item">
                <div className="summary-header">
                  <strong>{chapter.title}</strong>
                  <span className="hint">{chapter.content.length} 字</span>
                </div>
                <label className="field">
                  <span>摘要</span>
                  <textarea
                    rows={3}
                    value={chapterSummaries[chapter.id] || ''}
                    onChange={(e) => onUpdateChapterSummary(chapter.id, e.target.value)}
                    placeholder={`为"${chapter.title}"写一段简短摘要，概括核心情节和关键事件...`}
                  />
                </label>
              </div>
            ))}
          </>
        )}

        {/* Version History Tab */}
        {tab === 'versions' && (
          <>
            <div className="section-head">
              <h2>历史版本</h2>
              <button
                type="button"
                className="primary"
                onClick={() => onCreateSnapshot(activeChapterId)}
                disabled={!activeChapterContent.trim()}
              >
                保存当前版本
              </button>
            </div>
            <div className="hint">
              当前章节：<strong>{activeChapterTitle}</strong>
              {activeSnapshotList.length === 0 && ' — 暂无历史版本'}
            </div>

            <div className="version-list">
              {activeSnapshotList.map((snapshot) => (
                <div key={snapshot.id} className="version-item">
                  <div className="version-header">
                    <strong>{formatTime(snapshot.createdAt)}</strong>
                    <span className="hint">{snapshot.content.length} 字</span>
                  </div>
                  <div className="version-preview">
                    <pre>{snapshot.content.slice(0, 200)}{snapshot.content.length > 200 ? '...' : ''}</pre>
                  </div>
                  <div className="action-row">
                    <button
                      type="button"
                      className="ghost"
                      onClick={() => {
                        if (confirm(`确定要恢复到 ${formatTime(snapshot.createdAt)} 的版本吗？当前内容将被覆盖。`)) {
                          onRestoreSnapshot(snapshot.id);
                        }
                      }}
                    >
                      恢复此版本
                    </button>
                    <button type="button" className="ghost" onClick={() => onDeleteSnapshot(snapshot.id)}>
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}