type CacheEntry<T> = {
  value?: T;
  promise?: Promise<T>;
  expiresAt?: number;
  lastAccessedAt: number;
};

const cache = new Map<string, CacheEntry<unknown>>();
const DEFAULT_TTL_MS = 5 * 60_000;
const DEFAULT_MAX_SIZE = 50;

const pruneCache = (maxSize = DEFAULT_MAX_SIZE) => {
  if (cache.size <= maxSize) {
    return;
  }

  const staleKeys = [...cache.entries()]
    .filter(([, entry]) => !entry.promise && (entry.expiresAt || 0) <= Date.now())
    .map(([key]) => key);

  staleKeys.forEach((key) => cache.delete(key));

  if (cache.size <= maxSize) {
    return;
  }

  [...cache.entries()]
    .sort((a, b) => (a[1].lastAccessedAt || 0) - (b[1].lastAccessedAt || 0))
    .slice(0, Math.max(0, cache.size - maxSize))
    .forEach(([key]) => cache.delete(key));
};

export async function getCachedReference<T>(
  key: string,
  loader: () => Promise<T>,
  options?: { force?: boolean; ttlMs?: number; maxSize?: number },
): Promise<T> {
  const existing = cache.get(key) as CacheEntry<T> | undefined;
  const now = Date.now();
  const ttlMs = options?.ttlMs ?? DEFAULT_TTL_MS;
  const maxSize = options?.maxSize ?? DEFAULT_MAX_SIZE;

  if (!options?.force && existing?.value !== undefined && (existing.expiresAt || 0) > now) {
    existing.lastAccessedAt = now;
    return existing.value;
  }

  if (!options?.force && existing?.promise) {
    existing.lastAccessedAt = now;
    return existing.promise;
  }

  const promise = loader()
    .then((value) => {
      cache.set(key, {
        value,
        expiresAt: Date.now() + ttlMs,
        lastAccessedAt: Date.now(),
      });
      pruneCache(maxSize);
      return value;
    })
    .catch((error) => {
      cache.delete(key);
      throw error;
    });

  cache.set(key, {
    ...existing,
    promise,
    lastAccessedAt: now,
  });
  return promise;
}

export function invalidateReferenceCache(...keys: string[]) {
  keys.forEach((key) => cache.delete(key));
}
