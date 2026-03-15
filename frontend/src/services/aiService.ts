const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export interface AIStreamCallbacks {
  onChunk: (content: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('accessToken');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function streamRequest(
  url: string,
  body: Record<string, unknown>,
  callbacks: AIStreamCallbacks,
  signal?: AbortSignal
) {
  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
      signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
      callbacks.onError(errorData.error || `HTTP ${response.status}`);
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      callbacks.onError('No response body');
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;

        const data = line.slice(6).trim();
        if (data === '[DONE]') {
          callbacks.onDone();
          return;
        }

        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            callbacks.onError(parsed.error);
            return;
          }
          if (parsed.content) {
            callbacks.onChunk(parsed.content);
          }
        } catch {
          // Skip unparseable chunks
        }
      }
    }

    callbacks.onDone();
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return;
    }
    const msg = error instanceof Error ? error.message : 'Unknown error';
    callbacks.onError(msg);
  }
}

export function generateSummary(
  resumeId: number,
  language: string,
  callbacks: AIStreamCallbacks,
  signal?: AbortSignal
) {
  return streamRequest(
    '/api/v1/ai/generate-summary',
    { resumeId, language },
    callbacks,
    signal
  );
}

export function enhanceDescription(
  content: string,
  language: string,
  callbacks: AIStreamCallbacks,
  signal?: AbortSignal,
  position?: string,
  company?: string
) {
  return streamRequest(
    '/api/v1/ai/enhance-description',
    { content, position, company, language },
    callbacks,
    signal
  );
}
