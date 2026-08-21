export interface OidcConfig {
  issuer: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export function authorizationUrl(config: OidcConfig, state: string): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: 'openid profile email',
    state,
  });

  return `${config.issuer}/protocol/openid-connect/auth?${params.toString()}`;
}

export function tokenEndpoint(config: OidcConfig): string {
  return `${config.issuer}/protocol/openid-connect/token`;
}

export function logoutUrl(config: OidcConfig, redirectTo: string): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    post_logout_redirect_uri: redirectTo,
  });

  return `${config.issuer}/protocol/openid-connect/logout?${params.toString()}`;
}

export interface JwtClaims {
  sub?: string;
  email?: string;
  preferred_username?: string;
  realm_access?: { roles?: string[] };
}

export function decodeJwt(token: string): JwtClaims {
  const [, payload] = token.split('.');
  if (!payload) {
    return {};
  }
  const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
  const json = Buffer.from(normalized, 'base64').toString('utf-8');
  return JSON.parse(json) as JwtClaims;
}

export function rolesFromToken(token: string): string[] {
  return decodeJwt(token).realm_access?.roles ?? [];
}
