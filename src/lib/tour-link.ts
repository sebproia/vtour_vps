/** Return an internal guest route, never a redirect supplied by an arbitrary QR. */
export function getTourJoinPath(value: string, origin: string): string | null {
  try {
    const url = new URL(value.trim(), origin);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return null;
    if (url.origin !== origin && url.origin !== 'https://vtour-vps.vercel.app') return null;
    if (!/^\/join\/[a-zA-Z0-9]{1,128}\/?$/.test(url.pathname)) return null;
    return url.pathname.replace(/\/$/, '');
  } catch {
    return null;
  }
}
