/**
 * Vitest Setup File
 *
 * This file runs before all tests and sets up the test environment.
 */

import { vi } from "vitest";

// Set required environment variables before any imports
process.env.FIREBASE_PROJECT_ID = "test-project";
process.env.GOOGLE_APPLICATION_CREDENTIALS = "/fake/path/to/credentials.json";

// Mock firebase-admin (it requires server-side initialization)
vi.mock("firebase-admin", () => ({
  initializeApp: vi.fn(),
  credential: {
    cert: vi.fn(),
    applicationDefault: vi.fn(),
  },
  firestore: vi.fn(() => ({
    collection: vi.fn(),
    doc: vi.fn(),
  })),
}));

// Mock firebase-admin/firestore
vi.mock("firebase-admin/firestore", () => ({
  getFirestore: vi.fn(() => ({
    collection: vi.fn(() => ({
      doc: vi.fn(),
      where: vi.fn(),
      orderBy: vi.fn(),
      limit: vi.fn(),
      get: vi.fn().mockResolvedValue({ docs: [] }),
    })),
  })),
  FieldValue: {
    serverTimestamp: vi.fn(),
    increment: vi.fn(),
    delete: vi.fn(),
  },
  Timestamp: {
    now: vi.fn(() => ({ toMillis: () => Date.now() })),
    fromMillis: vi.fn((ms) => ({ toMillis: () => ms })),
  },
}));

// Mock the Firebase initialization module
vi.mock("@/lib/firebase/firestore.admin", () => ({
  firestoreAdmin: {
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        get: vi.fn().mockResolvedValue({ exists: false, data: () => null }),
        set: vi.fn().mockResolvedValue(undefined),
        update: vi.fn().mockResolvedValue(undefined),
        delete: vi.fn().mockResolvedValue(undefined),
      })),
      where: vi.fn(() => ({
        orderBy: vi.fn(() => ({
          limit: vi.fn(() => ({
            get: vi.fn().mockResolvedValue({ docs: [] }),
          })),
          get: vi.fn().mockResolvedValue({ docs: [] }),
        })),
        get: vi.fn().mockResolvedValue({ docs: [] }),
      })),
      get: vi.fn().mockResolvedValue({ docs: [] }),
    })),
  },
}));

// Mock domain services that depend on Firebase
vi.mock("@/domain/transactions/services/transaction.service", () => ({
  TransactionService: {
    listByDateRange: vi.fn().mockResolvedValue([]),
    getById: vi.fn().mockResolvedValue(null),
  },
}));

vi.mock("@/domain/categories/services/category.service", () => ({
  CategoryService: {
    listByUser: vi.fn().mockResolvedValue([]),
    getById: vi.fn().mockResolvedValue(null),
  },
}));

vi.mock("@/domain/accounts/services/account.service", () => ({
  AccountService: {
    listByUser: vi.fn().mockResolvedValue([]),
    getById: vi.fn().mockResolvedValue(null),
  },
}));

vi.mock("@/domain/audit/services/audit.service", () => ({
  AuditService: {
    recordEvent: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("@/domain/budgets/services/budget.service", () => ({
  BudgetService: {
    listByUser: vi.fn().mockResolvedValue([]),
    getById: vi.fn().mockResolvedValue(null),
    getByMonth: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock("@/domain/points/ai", () => ({
  PointsContextService: {
    executeTool: vi
      .fn()
      .mockResolvedValue({ success: false, error: "Not implemented in test" }),
  },
}));

vi.mock("@/domain/points/ai/points-tools.types", () => ({
  isValidPointsToolName: vi.fn().mockReturnValue(false),
  POINTS_TOOLS_SCHEMAS: [],
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});
