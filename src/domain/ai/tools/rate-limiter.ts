export interface RateLimitConfig {
  maxCalls: number;
  windowMs: number;
  maxConcurrent: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxCalls: 50, // 50 calls per minute
  windowMs: 60 * 1000, // 1 minute
  maxConcurrent: 5, // 5 concurrent executions
};

const TOOL_LIMITS: Partial<Record<string, RateLimitConfig>> = {
  search_transactions: {
    maxCalls: 20,
    windowMs: 60 * 1000,
    maxConcurrent: 2,
  },
  get_investment_performance: {
    maxCalls: 10,
    windowMs: 60 * 1000,
    maxConcurrent: 1,
  },
};

interface UserState {
  calls: number[];
  concurrent: number;
}

const userStates = new Map<string, UserState>();

const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
let lastCleanup = Date.now();

function cleanupStaleEntries(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) {
    return;
  }

  const maxAge = 10 * 60 * 1000; // 10 minutes
  for (const [userId, state] of userStates.entries()) {
    state.calls = state.calls.filter((timestamp) => now - timestamp < maxAge);

    if (state.calls.length === 0 && state.concurrent === 0) {
      userStates.delete(userId);
    }
  }

  lastCleanup = now;
}

export interface RateLimitResult {
  allowed: boolean;
  reason?: string;
  retryAfterMs?: number;
  remaining?: number;
}

export function checkRateLimit(
  userId: string,
  toolName: string,
): RateLimitResult {
  cleanupStaleEntries();

  const config = TOOL_LIMITS[toolName] || DEFAULT_CONFIG;
  const now = Date.now();

  let state = userStates.get(userId);
  if (!state) {
    state = { calls: [], concurrent: 0 };
    userStates.set(userId, state);
  }

  state.calls = state.calls.filter(
    (timestamp) => now - timestamp < config.windowMs,
  );

  if (state.concurrent >= config.maxConcurrent) {
    return {
      allowed: false,
      reason: `Maximum concurrent executions (${config.maxConcurrent}) reached`,
      retryAfterMs: 1000,
    };
  }

  if (state.calls.length >= config.maxCalls) {
    const oldestCall = state.calls[0];
    const retryAfterMs = config.windowMs - (now - oldestCall);

    return {
      allowed: false,
      reason: `Rate limit exceeded (${config.maxCalls} calls per ${config.windowMs / 1000}s)`,
      retryAfterMs,
      remaining: 0,
    };
  }

  return {
    allowed: true,
    remaining: config.maxCalls - state.calls.length - 1,
  };
}

export function recordCallStart(userId: string, _toolName: string): void {
  const state = userStates.get(userId);
  if (state) {
    state.calls.push(Date.now());
    state.concurrent++;
  }
}

export function recordCallEnd(userId: string, _toolName: string): void {
  const state = userStates.get(userId);
  if (state && state.concurrent > 0) {
    state.concurrent--;
  }
}

export function getRateLimitStatus(userId: string): {
  callsInWindow: number;
  concurrent: number;
  windowMs: number;
  maxCalls: number;
  maxConcurrent: number;
} {
  const state = userStates.get(userId);
  const config = DEFAULT_CONFIG;
  const now = Date.now();

  if (!state) {
    return {
      callsInWindow: 0,
      concurrent: 0,
      windowMs: config.windowMs,
      maxCalls: config.maxCalls,
      maxConcurrent: config.maxConcurrent,
    };
  }

  const callsInWindow = state.calls.filter(
    (timestamp) => now - timestamp < config.windowMs,
  ).length;

  return {
    callsInWindow,
    concurrent: state.concurrent,
    windowMs: config.windowMs,
    maxCalls: config.maxCalls,
    maxConcurrent: config.maxConcurrent,
  };
}

export function resetRateLimit(userId: string): void {
  userStates.delete(userId);
}
