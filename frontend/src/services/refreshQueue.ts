/**
 * Singleton refresh queue — imported ONLY by apiClient.ts.
 *
 * Prevents concurrent POST /auth/refresh calls when multiple
 * API requests receive a 401 at the same time.
 * The first request starts the refresh; all subsequent 401s are
 * held in this queue and resolved/rejected once the refresh settles.
 */

interface QueueEntry {
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}

/** Whether a /auth/refresh call is currently in-flight */
export let isRefreshing = false;

/** Queued requests waiting for the ongoing refresh to complete */
let queue: QueueEntry[] = [];

/** Toggle the in-flight flag */
export function setRefreshing(value: boolean): void {
  isRefreshing = value;
}

/**
 * Drain the queue after refresh completes.
 * @param error  Non-null → reject all queued promises.
 * @param token  The new access token → resolve all queued promises.
 */
export function processQueue(error: unknown, token: string | null): void {
  queue.forEach((entry) => {
    if (error) {
      entry.reject(error);
    } else {
      entry.resolve(token as string);
    }
  });
  queue = [];
}

/**
 * Add the current request to the wait queue.
 * Returns a Promise that will resolve with the new token once
 * the ongoing refresh finishes.
 */
export function enqueue(): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    queue.push({ resolve, reject });
  });
}
