const API_URL = process.env.API_URL ?? "http://localhost:8000/api";

const ASSET_ORIGIN = API_URL.replace(/\/api\/?$/, "");

export function resolveImageUrl(url: string | null | undefined): string | null {
  if (!url) {
    return null;
  }
  if (/^https?:\/\//i.test(url)) {
    return url;
  }
  return `${ASSET_ORIGIN}${url.startsWith("/") ? url : `/${url}`}`;
}
