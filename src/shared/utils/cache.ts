type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();

  /**
   * Set key value with TTL
   * @param key unique string key
   * @param value data to be cached
   * @param ttlMs TTL in milliseconds (default 5 minutes)
   */
  set<T>(key: string, value: T, ttlMs: number = 300000): void {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  /**
   * Get value of cached key
   * @param key unique string key
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Delete specific key from cache
   * @param key unique string key
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate all keys matching a specific pattern (e.g. starting with "trip_services:")
   * @param pattern prefix pattern string
   */
  clearPattern(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cached keys
   */
  clear(): void {
    this.cache.clear();
  }
}

export const memoryCache = new MemoryCache();
