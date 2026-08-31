import { describe, expect, it } from 'vitest';
import { commitSession, getSession } from './session.server';
import { getUser, requireAdmin, requireUser } from './auth.server';

const encodeToken = (claims: object): string => {
  const body = Buffer.from(JSON.stringify(claims)).toString('base64url');
  return `header.${body}.signature`;
};

async function requestWithToken(token?: string): Promise<Request> {
  const session = await getSession(new Request('http://app/'));
  if (token) {
    session.set('access_token', token);
  }
  const cookie = await commitSession(session);
  return new Request('http://app/', { headers: { Cookie: cookie } });
}

describe('auth.server', () => {
  it('returns null when there is no session token', async () => {
    const request = await requestWithToken();
    expect(await getUser(request)).toBeNull();
  });

  it('builds a user from a valid session token', async () => {
    const token = encodeToken({
      sub: 'user-1',
      email: 'buyer@test.com',
      realm_access: { roles: ['customer'] },
    });
    const request = await requestWithToken(token);

    const user = await getUser(request);
    expect(user).toEqual({ id: 'user-1', email: 'buyer@test.com', roles: ['customer'] });
  });

  it('falls back to preferred_username when email claim is missing', async () => {
    const token = encodeToken({ sub: 'user-1', preferred_username: 'buyer' });
    const request = await requestWithToken(token);

    expect((await getUser(request))?.email).toBe('buyer');
  });

  it('requireUser redirects to login when unauthenticated', async () => {
    const request = await requestWithToken();

    await expect(requireUser(request)).rejects.toMatchObject({
      status: 302,
    });
  });

  it('requireUser returns the user when authenticated', async () => {
    const token = encodeToken({ sub: 'user-1', email: 'buyer@test.com' });
    const request = await requestWithToken(token);

    await expect(requireUser(request)).resolves.toMatchObject({ id: 'user-1' });
  });

  it('requireAdmin rejects a non-admin user with 403', async () => {
    const token = encodeToken({
      sub: 'user-1',
      email: 'buyer@test.com',
      realm_access: { roles: ['customer'] },
    });
    const request = await requestWithToken(token);

    await expect(requireAdmin(request)).rejects.toMatchObject({ status: 403 });
  });

  it('requireAdmin allows a user with the admin role', async () => {
    const token = encodeToken({
      sub: 'admin-1',
      email: 'admin@test.com',
      realm_access: { roles: ['admin'] },
    });
    const request = await requestWithToken(token);

    await expect(requireAdmin(request)).resolves.toMatchObject({ id: 'admin-1' });
  });
});
