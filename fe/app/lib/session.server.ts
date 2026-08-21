import { createCookieSessionStorage } from '@remix-run/node';

const storage = createCookieSessionStorage({
  cookie: {
    name: 'shop_session',
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secrets: [process.env.SESSION_SECRET ?? 'change_me_session'],
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 8,
  },
});

export function getSession(request: Request) {
  return storage.getSession(request.headers.get('Cookie'));
}

export const commitSession = storage.commitSession;
export const destroySession = storage.destroySession;
