import { afterEach, describe, expect, it, vi } from 'vitest';
import { commitSession, getSession } from './session.server';
import { apiAuthed, apiGet } from './api.server';

afterEach(() => {
  vi.unstubAllGlobals();
});

async function authedRequest(token: string): Promise<Request> {
  const session = await getSession(new Request('http://app/'));
  session.set('access_token', token);
  const cookie = await commitSession(session);
  return new Request('http://app/', { headers: { Cookie: cookie } });
}

describe('api.server', () => {
  it('apiGet returns parsed json on success', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiGet('/categories')).resolves.toEqual({ ok: true });
  });

  it('apiGet throws a Response on a non-ok upstream status', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('nope', { status: 500 })),
    );

    await expect(apiGet('/categories')).rejects.toMatchObject({ status: 500 });
  });

  it('carries the upstream JSON error message onto the thrown Response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: 'Cart is empty' }), { status: 422 }),
      ),
    );

    const error = (await apiGet('/checkout').catch((e: unknown) => e)) as Response;
    expect(error.status).toBe(422);
    expect(await error.text()).toBe('Cart is empty');
  });

  it('falls back to a generic message for a non-JSON error body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('<html>gateway down</html>', { status: 502 })),
    );

    const error = (await apiGet('/categories').catch((e: unknown) => e)) as Response;
    expect(error.status).toBe(502);
    expect(await error.text()).not.toContain('<html>');
  });

  it('apiAuthed attaches the bearer token from the session', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ items: [] }), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const request = await authedRequest('token-abc');
    await apiAuthed(request, '/cart');

    const [, init] = fetchMock.mock.calls[0];
    expect((init.headers as Headers).get('Authorization')).toBe('Bearer token-abc');
  });

  it('apiAuthed omits Authorization when there is no session token', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const request = new Request('http://app/');
    await apiAuthed(request, '/categories');

    const [, init] = fetchMock.mock.calls[0];
    expect((init.headers as Headers).has('Authorization')).toBe(false);
  });

  it('apiAuthed returns undefined for a 204 response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })));

    const request = new Request('http://app/');
    await expect(apiAuthed(request, '/cart/items/1', { method: 'DELETE' })).resolves.toBeUndefined();
  });

  it('apiAuthed leaves Content-Type unset for FormData bodies', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const body = new FormData();
    body.append('image', new File(['x'], 'p.jpg', { type: 'image/jpeg' }));
    const request = await authedRequest('token-abc');
    await apiAuthed(request, '/admin/products/images', { method: 'POST', body });

    const [, init] = fetchMock.mock.calls[0];
    expect((init.headers as Headers).has('Content-Type')).toBe(false);
  });
});
