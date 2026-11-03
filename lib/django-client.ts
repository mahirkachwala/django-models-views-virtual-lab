export type Book = {
  id: number;
  title: string;
  author: string;
  category: string;
  price: number;
  available: boolean;
};
export type BookReply = {
  books: Book[];
  result: Book[];
  message: string;
  operation: string;
  sqlCount: number;
};
export type MigrationState = {
  changed: boolean;
  generated: boolean;
  applied: boolean;
  columns: string[];
  output: string;
};
export type RequestStage = { name: string; detail: string };
export type RequestReply = {
  method: 'GET' | 'POST';
  path: string;
  status: number;
  statusText: string;
  html: string;
  view: string;
  records: number;
  sqlCount: number;
  stages: RequestStage[];
};
let token = '';
export class ApiError extends Error {
  status: number;
  code: string;
  constructor(message: string, status: number, code = 'request_failed') {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}
async function parse<T>(response: Response): Promise<T> {
  let data: Record<string, unknown>;
  try {
    data = (await response.json()) as Record<string, unknown>;
  } catch {
    throw new ApiError(
      'The local Django experiment service is unavailable.',
      response.status,
    );
  }
  if (typeof data.csrfToken === 'string') token = data.csrfToken;
  if (!response.ok)
    throw new ApiError(
      typeof data.error === 'string'
        ? data.error
        : 'The operation could not be completed.',
      response.status,
      typeof data.code === 'string' ? data.code : undefined,
    );
  return data as T;
}
export async function getState() {
  const response = await fetch('/api/state/', { credentials: 'same-origin' });
  return parse<{ books: Book[]; csrfToken: string }>(response);
}
async function ensureToken() {
  if (!token) {
    const state = await getState();
    token = state.csrfToken;
  }
}
export async function request<T>(path: string, options: RequestInit = {}) {
  if (options.method && options.method !== 'GET') {
    await ensureToken();
    const headers = new Headers(options.headers);
    headers.set('X-CSRFToken', token);
    options.headers = headers;
  }
  return parse<T>(
    await fetch(path, { credentials: 'same-origin', ...options }),
  );
}
export function queryBooks(params: Record<string, string>) {
  return request<BookReply>('/api/books/?' + new URLSearchParams(params));
}
export function createBook(book: Omit<Book, 'id'>) {
  return request<BookReply>('/api/books/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(book),
  });
}
export function readBook(id: number) {
  return request<BookReply>('/api/books/' + id + '/');
}
export function updateBook(id: number, fields: Partial<Omit<Book, 'id'>>) {
  return request<BookReply>('/api/books/' + id + '/', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  });
}
export function deleteBook(id: number) {
  return request<BookReply>('/api/books/' + id + '/', { method: 'DELETE' });
}
export function resetDatabase() {
  return request<BookReply>('/api/reset/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
}
export function migration(action: 'change' | 'generate' | 'apply' | 'reset') {
  return request<MigrationState>('/api/migrations/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
  });
}
export function getMigration() {
  return request<MigrationState>('/api/migrations/');
}
export function executeRequest(payload: {
  method: 'GET' | 'POST';
  path: string;
  title?: string;
  author?: string;
  category?: string;
  price?: number;
  available?: boolean;
}) {
  return request<RequestReply>('/api/request/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
