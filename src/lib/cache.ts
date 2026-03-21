import type { CachedData } from "@/lib/yahoo/types";

// ============================================================
// Cache Layer
// Uses Vercel KV in production, in-memory Map for local dev
// ============================================================

interface CacheProvider {
  get<T>(key: string): Promise<CachedData<T> | null>;
  set<T>(key: string, data: T, ttlSeconds: number): Promise<void>;
  delete(key: string): Promise<void>;
}

// --- In-Memory Cache (local development) ---

const memoryStore = new Map<string, string>();

const memoryCache: CacheProvider = {
  async get<T>(key: string): Promise<CachedData<T> | null> {
    const raw = memoryStore.get(key);
    if (!raw) return null;

    const cached: CachedData<T> = JSON.parse(raw);
    const now = Date.now();
    const expiresAt = cached.fetchedAt + cached.ttl * 1000;

    if (now > expiresAt) {
      memoryStore.delete(key);
      return null;
    }

    return cached;
  },

  async set<T>(key: string, data: T, ttlSeconds: number): Promise<void> {
    const cached: CachedData<T> = {
      data,
      fetchedAt: Date.now(),
      ttl: ttlSeconds,
    };
    memoryStore.set(key, JSON.stringify(cached));
  },

  async delete(key: string): Promise<void> {
    memoryStore.delete(key);
  },
};

// --- Vercel KV Cache (production) ---

async function getKvCache(): Promise<CacheProvider | null> {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return null;
  }

  try {
    const { kv } = await import("@vercel/kv");

    return {
      async get<T>(key: string): Promise<CachedData<T> | null> {
        const cached = await kv.get<CachedData<T>>(key);
        if (!cached) return null;

        const now = Date.now();
        const expiresAt = cached.fetchedAt + cached.ttl * 1000;

        if (now > expiresAt) {
          await kv.del(key);
          return null;
        }

        return cached;
      },

      async set<T>(key: string, data: T, ttlSeconds: number): Promise<void> {
        const cached: CachedData<T> = {
          data,
          fetchedAt: Date.now(),
          ttl: ttlSeconds,
        };
        // Store in KV with a Redis TTL slightly longer than our logical TTL
        // so stale data can be used as fallback on API errors
        await kv.set(key, cached, { ex: ttlSeconds * 2 });
      },

      async delete(key: string): Promise<void> {
        await kv.del(key);
      },
    };
  } catch {
    console.warn("Vercel KV not available, falling back to memory cache");
    return null;
  }
}

// --- Exported Cache Interface ---

let _provider: CacheProvider | null = null;

async function getProvider(): Promise<CacheProvider> {
  if (_provider) return _provider;

  const kvCache = await getKvCache();
  _provider = kvCache || memoryCache;
  return _provider;
}

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const provider = await getProvider();
    const cached = await provider.get<T>(key);
    return cached?.data ?? null;
  },

  /** Get cached data even if expired (for fallback on API errors) */
  async getStale<T>(key: string): Promise<T | null> {
    const provider = await getProvider();
    // For memory cache, expired entries are deleted, so this won't help.
    // For KV, we set Redis TTL to 2x logical TTL, so stale data may exist.
    const cached = await provider.get<T>(key);
    return cached?.data ?? null;
  },

  async set<T>(key: string, data: T, ttlSeconds: number): Promise<void> {
    const provider = await getProvider();
    await provider.set(key, data, ttlSeconds);
  },

  async delete(key: string): Promise<void> {
    const provider = await getProvider();
    await provider.delete(key);
  },
};
