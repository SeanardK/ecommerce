import { getAccessToken } from './auth.server';

const API_URL = process.env.API_URL ?? 'http://localhost:8000/api';

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`);
  if (!response.ok) {
    throw new Response('Upstream error', { status: response.status });
  }
  return (await response.json()) as T;
}

export async function apiAuthed<T>(
  request: Request,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = await getAccessToken(request);
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (!response.ok) {
    throw new Response('Upstream error', { status: response.status });
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}
