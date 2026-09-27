/**
 * OpenAI-compatible client — plain fetch, no SDK weight.
 * Works with any endpoint that speaks the /v1 protocol: OpenAI, Ollama,
 * OpenRouter, or self-hosted gateways.
 */

export type ModelInfo = {
  id: string;
  ownedBy?: string;
  created?: number;
};

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Accept "https://host", "host:11434", "…/v1" — always produce a clean
 * origin + /v1. trim() guards against pasted whitespace.
 */
export function normalizeBase(raw: string): string {
  let base = raw.trim().replace(/\/+$/, '');
  if (!base) return '';
  if (!/^https?:\/\//i.test(base)) base = `http://${base}`;
  if (!/\/v1$/i.test(base)) base += '/v1';
  return base;
}

export function isProbablyUrl(raw: string): boolean {
  const value = normalizeBase(raw);
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.hostname.length > 0;
  } catch {
    return false;
  }
}

function authHeaders(apiKey: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
  return headers;
}

async function errorFrom(res: Response): Promise<ApiError> {
  let detail = `${res.status} ${res.statusText}`.trim();
  try {
    const body = (await res.json()) as { error?: { message?: string } | string };
    const message =
      typeof body?.error === 'string'
        ? body.error
        : body?.error?.message;
    if (message) detail = message;
  } catch {
    // Non-JSON error body — keep the status line.
  }
  return new ApiError(res.status, detail);
}

export async function listModels(
  baseUrl: string,
  apiKey: string,
): Promise<ModelInfo[]> {
  const res = await fetch(`${normalizeBase(baseUrl)}/models`, {
    headers: authHeaders(apiKey),
  });
  if (!res.ok) throw await errorFrom(res);
  const json = (await res.json()) as {
    data?: Array<{ id?: string; owned_by?: string; created?: number }>;
  };
  const rows = Array.isArray(json?.data) ? json.data : [];
  return rows
    .filter((m): m is { id: string; owned_by?: string; created?: number } =>
      Boolean(m && typeof m.id === 'string'),
    )
    .map((m) => ({
      id: m.id,
      ownedBy: m.owned_by,
      created: m.created,
    }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

export type ChatTurn = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

/**
 * Stream an assistant reply as an async generator of content deltas.
 * The caller renders each chunk as it lands — first token fast, no spinner.
 */
export async function* streamChat(opts: {
  baseUrl: string;
  apiKey: string;
  model: string;
  messages: ChatTurn[];
  temperature: number;
  signal?: AbortSignal;
}): AsyncGenerator<string> {
  const res = await fetch(`${normalizeBase(opts.baseUrl)}/chat/completions`, {
    method: 'POST',
    headers: authHeaders(opts.apiKey),
    body: JSON.stringify({
      model: opts.model,
      messages: opts.messages,
      temperature: opts.temperature,
      stream: true,
    }),
    signal: opts.signal,
  });
  if (!res.ok) throw await errorFrom(res);
  if (!res.body) throw new ApiError(0, 'Streaming is not supported here');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let newlineAt = buffer.indexOf('\n');
    while (newlineAt >= 0) {
      const line = buffer.slice(0, newlineAt).trim();
      buffer = buffer.slice(newlineAt + 1);
      newlineAt = buffer.indexOf('\n');

      if (!line.startsWith('data:')) continue;
      const payload = line.slice(5).trim();
      if (payload === '[DONE]') return;
      try {
        const json = JSON.parse(payload) as {
          choices?: Array<{
            delta?: { content?: string };
            message?: { content?: string };
          }>;
        };
        const choice = json.choices?.[0];
        const delta = choice?.delta?.content ?? choice?.message?.content ?? '';
        if (delta) yield delta;
      } catch {
        // Keepalive or fragmented comment — skip silently.
      }
    }
  }
}

/** Single-shot completion when streaming is off in preferences. */
export async function chatComplete(opts: {
  baseUrl: string;
  apiKey: string;
  model: string;
  messages: ChatTurn[];
  temperature: number;
  signal?: AbortSignal;
}): Promise<string> {
  const res = await fetch(`${normalizeBase(opts.baseUrl)}/chat/completions`, {
    method: 'POST',
    headers: authHeaders(opts.apiKey),
    body: JSON.stringify({
      model: opts.model,
      messages: opts.messages,
      temperature: opts.temperature,
      stream: false,
    }),
    signal: opts.signal,
  });
  if (!res.ok) throw await errorFrom(res);
  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return json.choices?.[0]?.message?.content ?? '';
}

export type ConnectionTest =
  | { ok: true; elapsedMs: number; models: number }
  | { ok: false; error: string };

export async function testConnection(
  baseUrl: string,
  apiKey: string,
): Promise<ConnectionTest> {
  const startedAt = Date.now();
  try {
    const models = await listModels(baseUrl, apiKey);
    return { ok: true, elapsedMs: Date.now() - startedAt, models: models.length };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}
