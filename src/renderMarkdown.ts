/**
 * Lightweight markdown renderer for AI responses.
 * Supports: bold, italic, inline code, code blocks, lists, links, paragraphs, line breaks.
 */
const CODE_BLOCK_RE = /```([\s\S]*?)```/g;
const INLINE_CODE_RE = /`([^`]+)`/g;
const BOLD_RE = /\*\*(.+?)\*\*/g;
const ITALIC_RE = /\*(.+?)\*/g;
const LINK_RE = /\[([^\]]+)\]\(([^)]+)\)/g;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderInline(text: string): string {
  let result = escapeHtml(text);
  result = result.replace(INLINE_CODE_RE, '<code>$1</code>');
  result = result.replace(BOLD_RE, '<strong>$1</strong>');
  result = result.replace(ITALIC_RE, '<em>$1</em>');
  result = result.replace(LINK_RE, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  return result;
}

export function renderMarkdown(raw: string): string {
  // Extract and protect code blocks first
  const codeBlocks: string[] = [];
  let text = raw.replace(CODE_BLOCK_RE, (_match, code) => {
    const index = codeBlocks.length;
    codeBlocks.push(escapeHtml(code.trim()));
    return `__CODE_BLOCK_${index}__`;
  });

  // Split into paragraphs by double newlines
  const paragraphs = text.split(/\n\n+/);
  const htmlParts: string[] = [];

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    // Check if it's a code block placeholder
    if (/^__CODE_BLOCK_\d+__$/.test(trimmed)) {
      const index = parseInt(trimmed.match(/__CODE_BLOCK_(\d+)__/)![1], 10);
      htmlParts.push(`<pre><code>${codeBlocks[index]}</code></pre>`);
      continue;
    }

    // Check if it's a list block
    const lines = trimmed.split('\n');
    const isList = lines.every((line) => /^[-*]\s/.test(line.trim()) || line.trim() === '');

    if (isList) {
      const items = lines
        .filter((line) => line.trim())
        .map((line) => `<li>${renderInline(line.replace(/^[-*]\s+/, ''))}</li>`)
        .join('');
      htmlParts.push(`<ul>${items}</ul>`);
      continue;
    }

    // Check if it's a numbered list
    const isOrderedList = lines.every((line) => /^\d+[.)]\s/.test(line.trim()) || line.trim() === '');
    if (isOrderedList) {
      const items = lines
        .filter((line) => line.trim())
        .map((line) => `<li>${renderInline(line.replace(/^\d+[.)]\s+/, ''))}</li>`)
        .join('');
      htmlParts.push(`<ol>${items}</ol>`);
      continue;
    }

    // Regular paragraph - preserve single line breaks as <br>
    const inlineHtml = lines.map((line) => renderInline(line)).join('<br/>');
    htmlParts.push(`<p>${inlineHtml}</p>`);
  }

  return htmlParts.join('');
}