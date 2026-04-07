import type { JWTPayload } from "@/types/auth.types";

let refreshTimerId: ReturnType<typeof setTimeout> | null = null;

/**
 * Decode a JWT without verifying the signature (client-side read-only).
 * Returns null if the token is malformed or cannot be parsed.
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    // JWT parts: header.payload.signature
    const base64Payload = token.split(".")[1];
    if (!base64Payload) return null;
    // atob requires standard base64; JWT uses URL-safe base64 (- and _)
    const json = atob(base64Payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json) as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * Return milliseconds until the token expires.
 * Returns 0 if the token is already expired or invalid.
 */
export function getTokenExpiry(token: string): number {
  const payload = decodeToken(token);
  if (!payload) return 0;
  const msUntilExpiry = payload.exp * 1000 - Date.now();
  return Math.max(0, msUntilExpiry);
}

/**
 * Schedule a proactive silent refresh ~60 seconds before the token expires.
 *
 * Cancels any previously scheduled timer before setting a new one,
 * so this is safe to call whenever the token is updated.
 *
 * @param token      The current access token to read expiry from.
 * @param onRefresh  Callback invoked when it is time to refresh.
 */
export function scheduleRefresh(token: string, onRefresh: () => void): void {
  clearRefreshTimer();

  const msUntilExpiry = getTokenExpiry(token);

  if (msUntilExpiry === 0) {
    // Token is already expired — trigger immediately
    onRefresh();
    return;
  }

  // Fire 60 s before expiry; minimum delay of 5 s to avoid tight loops
  const delay = Math.max(msUntilExpiry - 60_000, 5_000);

  refreshTimerId = setTimeout(() => {
    onRefresh();
  }, delay);
}

/** Cancel any pending proactive refresh timer */
export function clearRefreshTimer(): void {
  if (refreshTimerId !== null) {
    clearTimeout(refreshTimerId);
    refreshTimerId = null;
  }
}
