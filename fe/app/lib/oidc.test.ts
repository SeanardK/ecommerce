import { describe, expect, it } from 'vitest';
import {
  authorizationUrl,
  decodeJwt,
  rolesFromToken,
  tokenEndpoint,
} from './oidc';

const config = {
  issuer: 'http://kc/realms/shop',
  clientId: 'shop-web',
  clientSecret: 'secret',
  redirectUri: 'http://app/auth/callback',
};

const encode = (claims: object): string => {
  const body = Buffer.from(JSON.stringify(claims)).toString('base64url');
  return `header.${body}.signature`;
};

describe('oidc', () => {
  it('builds an authorization url with the expected params', () => {
    const url = new URL(authorizationUrl(config, 'state-123'));
    expect(url.searchParams.get('client_id')).toBe('shop-web');
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('state')).toBe('state-123');
    expect(url.searchParams.get('redirect_uri')).toBe('http://app/auth/callback');
  });

  it('builds the token endpoint', () => {
    expect(tokenEndpoint(config)).toBe(
      'http://kc/realms/shop/protocol/openid-connect/token',
    );
  });

  it('decodes claims from a jwt', () => {
    const token = encode({ sub: 'user-1', email: 'a@test.com' });
    expect(decodeJwt(token).sub).toBe('user-1');
  });

  it('extracts realm roles', () => {
    const token = encode({ realm_access: { roles: ['customer', 'admin'] } });
    expect(rolesFromToken(token)).toEqual(['customer', 'admin']);
  });
});
