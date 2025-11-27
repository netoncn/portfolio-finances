interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  size: number;
}

export class MemoryCache {
  private cache: Map<string, CacheEntry<unknown>>;
  private stats: CacheStats;
  private cleanupInterval: NodeJS.Timeout | null;
  private defaultTTL: number;

  constructor(defaultTTL = 5 * 60 * 1000) {
    // Default TTL: 5 minutes
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      size: 0,
    };
    this.defaultTTL = defaultTTL;
    this.cleanupInterval = null;

    // Start cleanup interval (every 60 seconds)
    this.startCleanup();
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.size = this.cache.size;
      return null;
    }

    this.stats.hits++;
    return entry.value;
  }

  set<T>(key: string, value: T, ttl?: number): void {
    const expiresAt = Date.now() + (ttl ?? this.defaultTTL);

    this.cache.set(key, {
      value,
      expiresAt,
    });

    this.stats.sets++;
    this.stats.size = this.cache.size;
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key);

    if (deleted) {
      this.stats.deletes++;
      this.stats.size = this.cache.size;
    }

    return deleted;
  }

  deletePattern(pattern: string): number {
    let deletedCount = 0;

    for (const key of this.cache.keys()) {
      if (key.startsWith(pattern)) {
        this.cache.delete(key);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      this.stats.deletes += deletedCount;
      this.stats.size = this.cache.size;
    }

    return deletedCount;
  }

  clear(): void {
    this.cache.clear();
    this.stats.size = 0;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.size = this.cache.size;
      return false;
    }

    return true;
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }

  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      size: this.cache.size,
    };
  }

  private startCleanup(): void {
    if (this.cleanupInterval) {
      return;
    }

    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 1000); // Every 60 seconds

    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  private cleanup(): void {
    const now = Date.now();
    let deletedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      this.stats.size = this.cache.size;
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
}

export const serverCache = new MemoryCache(5 * 60 * 1000);

export const CacheKeys = {
  dashboardKPIs: (userId: string, year: number, month: number): string => {
    return `dashboard:kpis:${userId}:${year}:${month}`;
  },

  dashboardUser: (userId: string): string => {
    return `dashboard:kpis:${userId}:`;
  },

  budgetCalculation: (budgetId: string): string => {
    return `budget:calc:${budgetId}`;
  },

  budgetUser: (userId: string): string => {
    return `budget:calc:user:${userId}:`;
  },

  transactionAggregation: (
    userId: string,
    year: number,
    month: number,
  ): string => {
    return `transaction:agg:${userId}:${year}:${month}`;
  },

  transactionUser: (userId: string): string => {
    return `transaction:agg:${userId}:`;
  },

  categorySpending: (userId: string, year: number, month: number): string => {
    return `category:spending:${userId}:${year}:${month}`;
  },

  categoryUser: (userId: string): string => {
    return `category:spending:${userId}:`;
  },
};

export const CacheInvalidation = {
  invalidateUserDashboard: (userId: string): number => {
    return serverCache.deletePattern(CacheKeys.dashboardUser(userId));
  },

  invalidateUserBudgets: (userId: string): number => {
    return serverCache.deletePattern(CacheKeys.budgetUser(userId));
  },

  invalidateUserTransactions: (userId: string): number => {
    return serverCache.deletePattern(CacheKeys.transactionUser(userId));
  },

  invalidateUserCategories: (userId: string): number => {
    return serverCache.deletePattern(CacheKeys.categoryUser(userId));
  },

  invalidateUser: (userId: string): number => {
    let total = 0;
    total += CacheInvalidation.invalidateUserDashboard(userId);
    total += CacheInvalidation.invalidateUserBudgets(userId);
    total += CacheInvalidation.invalidateUserTransactions(userId);
    total += CacheInvalidation.invalidateUserCategories(userId);
    return total;
  },
};
