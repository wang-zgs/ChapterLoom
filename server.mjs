import http from 'node:http';

const PORT = Number(process.env.AI_PROXY_PORT || 8787);

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  });
  res.end(body);
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function buildMessages({ systemPrompt, contextText, history, question }) {
  return [
    { role: 'system', content: systemPrompt || '你是一个写作助手。' },
    { role: 'system', content: `可用上下文如下：\n${contextText || '（无）'}` },
    ...(history || []).slice(-6),
    { role: 'user', content: question },
  ];
}

function resolveEndpoint(input) {
  const trimmed = String(input || '').trim();
  if (!trimmed) {
    return '';
  }

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    return trimmed;
  }

  return parsed.toString();
}

function isLocalHost(hostname) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}

function isOllamaEndpoint(endpoint) {
  try {
    const parsed = new URL(endpoint);
    return isLocalHost(parsed.hostname) && parsed.port === '11434';
  } catch {
    return false;
  }
}

function normalizeOllamaEndpoint(endpoint) {
  const parsed = new URL(endpoint);
  if (parsed.pathname === '/' || parsed.pathname === '') {
    parsed.pathname = '/api/chat';
  }
  return parsed.toString();
}

function normalizeOpenAIEndpoint(endpoint) {
  const parsed = new URL(endpoint);
  if (parsed.pathname === '/' || parsed.pathname === '') {
    parsed.pathname = '/chat/completions';
  }
  return parsed.toString();
}

function sendSseChunk(res, data) {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function endSse(res, data) {
  if (data) {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }
  res.write('data: [DONE]\n\n');
  res.end();
}

async function handleAiStream(req, res, body) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
  });

  const endpoint = resolveEndpoint(body.endpoint);
  const apiKey = String(body.apiKey || '').trim();
  const model = String(body.model || '').trim();
  const systemPrompt = String(body.systemPrompt || '').trim();
  const contextText = String(body.contextText || '');
  const question = String(body.question || '').trim();
  const history = Array.isArray(body.history) ? body.history : [];
  const ollamaMode = String(body.provider || '').trim() === 'ollama' || (endpoint ? isOllamaEndpoint(endpoint) : false);
  const resolvedEndpoint = ollamaMode ? normalizeOllamaEndpoint(endpoint) : normalizeOpenAIEndpoint(endpoint);

  if (!resolvedEndpoint || (!ollamaMode && !apiKey)) {
    const fake = fakeAnswer(contextText, question);
    sendSseChunk(res, { content: fake });
    endSse(res);
    return;
  }

  const requestHeaders = { 'Content-Type': 'application/json' };
  if (!ollamaMode) {
    requestHeaders.Authorization = `Bearer ${apiKey}`;
  }

  const requestBody = ollamaMode
    ? {
        model,
        messages: buildMessages({ systemPrompt, contextText, history, question }),
        stream: true,
      }
    : {
        model,
        messages: buildMessages({ systemPrompt, contextText, history, question }),
        temperature: 0.7,
        stream: true,
      };

  try {
    const response = await fetch(resolvedEndpoint, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      const fake = fakeAnswer(contextText, question);
      sendSseChunk(res, {
        content: fake,
        warning: `上游接口返回 ${response.status}，已回退到本地模拟回复。${errorText ? ` 详情：${errorText}` : ''}`,
      });
      endSse(res);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullContent = '';

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

        if (ollamaMode) {
          // Ollama uses NDJSON: each line is a JSON object directly
          try {
            parsed = JSON.parse(trimmed);
          } catch {
            continue;
          }
          const chunk = parsed?.message?.content || '';
          if (chunk) {
            fullContent += chunk;
            sendSseChunk(res, { content: fullContent });
          }
        } else {
          // OpenAI uses SSE: lines start with "data:"
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
            fullContent += chunk;
            sendSseChunk(res, { content: fullContent });
          }
        }
      }
    }

    if (!fullContent) {
      const fake = fakeAnswer(contextText, question);
      sendSseChunk(res, { content: fake, warning: 'AI 返回内容为空，已回退到本地模拟回复。' });
    }
    endSse(res);
  } catch (error) {
    const fake = fakeAnswer(contextText, question);
    sendSseChunk(res, {
      content: fake,
      warning: error instanceof Error ? error.message : 'AI 请求失败，已回退到本地模拟回复。',
    });
    endSse(res);
  }
}

function fakeAnswer(contextText, question) {
  const contextPreview = contextText.trim().slice(0, 220) || '未选择章节上下文';
  return [
    '当前未配置可用的 AI 接口，以下是模拟回复：',
    `问题：${question}`,
    `上下文预览：${contextPreview}${contextText.length > 220 ? '...' : ''}`,
    '你可以在设置中填写真实模型接口后自动转发。',
  ].join('\n\n');
}

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {});
    return;
  }

  if (req.method === 'POST' && req.url === '/api/ai') {
    void readRequestBody(req).then((body) => handleAiStream(req, res, body));
    return;
  }

  sendJson(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`AI proxy listening on http://localhost:${PORT}`);
});