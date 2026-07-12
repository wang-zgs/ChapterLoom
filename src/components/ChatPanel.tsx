import { useMemo } from 'react';
import type { ChatMessage } from '../types';
import { formatTime } from '../utils';
import { renderMarkdown } from '../renderMarkdown';

type ChatPanelProps = {
  chat: ChatMessage[];
  draftQuestion: string;
  sending: boolean;
  selectedContextTitles: string[];
  onDraftQuestionChange: (value: string) => void;
  onSubmit: () => void;
  onClear: () => void;
};

function MessageContent({ content, role }: { content: string; role: string }) {
  // User messages and empty content use plain text, AI messages get markdown
  const html = useMemo(() => {
    if (role === 'user' || !content) return null;
    return renderMarkdown(content);
  }, [content, role]);

  if (role === 'user') {
    return <pre>{content}</pre>;
  }

  if (!content) {
    return <pre className="streaming-cursor"></pre>;
  }

  return <div className="markdown-body" dangerouslySetInnerHTML={{ __html: html! }} />;
}

export function ChatPanel({
  chat,
  draftQuestion,
  sending,
  selectedContextTitles,
  onDraftQuestionChange,
  onSubmit,
  onClear,
}: ChatPanelProps) {
  return (
    <section className="ai-panel chat-panel">
      <div className="section-head">
        <h2>AI 对话</h2>
        <span className="hint">
          {selectedContextTitles.length > 0 ? `当前上下文：${selectedContextTitles.join('、')}` : '尚未配置上下文'}
        </span>
      </div>

      <label className="field">
        <span>问题</span>
        <textarea
          rows={4}
          value={draftQuestion}
          onChange={(event) => onDraftQuestionChange(event.target.value)}
          placeholder="向 AI 提问，比如：帮我判断这一段节奏是否太慢"
        />
      </label>

      <div className="action-row">
        <button type="button" className="primary" onClick={onSubmit} disabled={sending}>
          {sending ? 'AI 思考中...' : '发送给 AI'}
        </button>
        <button type="button" className="ghost" onClick={onClear}>
          清空对话
        </button>
      </div>

      <div className="chat-list">
        {chat.length === 0 ? (
          <div className="empty-state">尚未发起对话</div>
        ) : (
          chat.map((message) => (
            <article key={message.id} className={`chat-message ${message.role}`}>
              <div className="chat-meta">
                <strong>{message.role === 'user' ? '你' : 'AI'}</strong>
                <span>{formatTime(message.createdAt)}</span>
              </div>
              <MessageContent content={message.content} role={message.role} />
            </article>
          ))
        )}
      </div>
    </section>
  );
}