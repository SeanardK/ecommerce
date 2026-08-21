import { redirect } from '@remix-run/node';
import {
  authorizationUrl,
  logoutUrl,
  OidcConfig,
  rolesFromToken,
  tokenEndpoint,
  decodeJwt,
} from './oidc';
import { commitSession, destroySession, getSession } from './session.server';

export interface SessionUser {
  id: string;
  email: string;
  roles: string[];
}

function config(): OidcConfig {
  const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
  return {
    issuer: process.env.KEYCLOAK_ISSUER ?? 'http://localhost:8080/realms/shop',
    clientId: process.env.KEYCLOAK_CLIENT_ID ?? 'shop-web',
    clientSecret: process.env.KEYCLOAK_CLIENT_SECRET ?? '',
    redirectUri: `${appUrl}/auth/callback`,
  };
}

export async function startLogin(request: Request): Promise<Response> {
  const session = await getSession(request);
  const state = crypto.randomUUID();
  session.set('oauth_state', state);

  return redirect(authorizationUrl(config(), state), {
    headers: { 'Set-Cookie': await commitSession(session) },
  });
}

export async function handleCallback(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const session = await getSession(request);

  if (!code || !state || state !== session.get('oauth_state')) {
    throw redirect('/auth/login');
  }

  const cfg = config();
  const response = await fetch(tokenEndpoint(cfg), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: cfg.redirectUri,
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
    }),
  });

  if (!response.ok) {
    throw redirect('/auth/login');
  }

  const tokens = (await response.json()) as {
    access_token: string;
    refresh_token: string;
  };

  session.set('access_token', tokens.access_token);
  session.set('refresh_token', tokens.refresh_token);
  session.unset('oauth_state');

  return redirect('/', {
    headers: { 'Set-Cookie': await commitSession(session) },
  });
}

export async function getAccessToken(request: Request): Promise<string | null> {
  const session = await getSession(request);
  return session.get('access_token') ?? null;
}

export async function getUser(request: Request): Promise<SessionUser | null> {
  const token = await getAccessToken(request);
  if (!token) {
    return null;
  }
  const claims = decodeJwt(token);
  if (!claims.sub) {
    return null;
  }
  return {
    id: claims.sub,
    email: claims.email ?? claims.preferred_username ?? '',
    roles: rolesFromToken(token),
  };
}

export async function requireUser(request: Request): Promise<SessionUser> {
  const user = await getUser(request);
  if (!user) {
    throw redirect('/auth/login');
  }
  return user;
}

export async function requireAdmin(request: Request): Promise<SessionUser> {
  const user = await requireUser(request);
  if (!user.roles.includes('admin')) {
    throw new Response('Forbidden', { status: 403 });
  }
  return user;
}

export async function logout(request: Request): Promise<Response> {
  const session = await getSession(request);
  const appUrl = process.env.APP_URL ?? 'http://localhost:3000';

  return redirect(logoutUrl(config(), appUrl), {
    headers: { 'Set-Cookie': await destroySession(session) },
  });
}
