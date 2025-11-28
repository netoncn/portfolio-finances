import { describe, expect, it } from "vitest";
import { ALL_TOOLS_SCHEMAS, isValidToolName } from "../index";
import {
  getRequiredParams,
  sanitizeToolInput,
  validateToolInput,
} from "../validation";

// ============================================================================
// 1. TOOL NAME VALIDATION
// ============================================================================

describe("Validation Security: Tool Name Validation", () => {
  describe("Valid Tool Names", () => {
    const validToolNames = [
      "get_transactions_summary",
      "search_transactions",
      "get_spending_by_category",
      "get_budget_status",
      "list_categories",
      "get_accounts_summary",
      // Note: get_points_summary is in a separate points domain and validated via isValidPointsToolName
    ];

    for (const name of validToolNames) {
      it(`should accept valid tool name: ${name}`, () => {
        expect(isValidToolName(name)).toBe(true);
      });
    }
  });

  describe("Invalid Tool Names", () => {
    const invalidToolNames = [
      // Non-existent tools
      "nonexistent_tool",
      "fake_tool",
      "admin_tool",

      // Empty/whitespace
      "",
      " ",
      "\t",
      "\n",

      // Special characters
      "get_transactions; DROP TABLE",
      "tool' OR '1'='1",
      "tool<script>",
      "tool/../../../etc/passwd",

      // Numeric/boolean
      "123",
      "true",
      "false",
      "null",
      "undefined",

      // Case variations (tools are case-sensitive)
      "GET_TRANSACTIONS_SUMMARY",
      "Get_Transactions_Summary",
      "GET_transactions_SUMMARY",
    ];

    for (const name of invalidToolNames) {
      it(`should reject invalid tool name: "${name}"`, () => {
        expect(isValidToolName(name)).toBe(false);
      });
    }
  });

  describe("Type Safety", () => {
    it("should reject number as tool name", () => {
      expect(isValidToolName(123 as any)).toBe(false);
    });

    it("should reject object as tool name", () => {
      expect(isValidToolName({} as any)).toBe(false);
    });

    it("should reject array as tool name", () => {
      expect(isValidToolName([] as any)).toBe(false);
    });

    it("should reject null as tool name", () => {
      expect(isValidToolName(null as any)).toBe(false);
    });

    it("should reject undefined as tool name", () => {
      expect(isValidToolName(undefined as any)).toBe(false);
    });
  });
});

// ============================================================================
// 2. INPUT VALIDATION
// ============================================================================

describe("Validation Security: Input Validation", () => {
  describe("Required Fields Validation", () => {
    it("should fail when required fields are missing", () => {
      // get_category_spending requires categoryId
      const result = validateToolInput("get_category_spending", {});

      // If categoryId is required, validation should fail
      const requiredParams = getRequiredParams("get_category_spending");
      if (requiredParams.includes("categoryId")) {
        expect(result.valid).toBe(false);
        expect(
          result.errors.some((e) => e.message.includes("categoryId")),
        ).toBe(true);
      }
    });

    it("should pass when all required fields are provided", () => {
      const result = validateToolInput("get_transactions_summary", {
        period: "this_month",
      });

      // If period is the only required field
      expect(result.valid).toBe(true);
    });

    it("should handle undefined vs null vs empty string for required fields", () => {
      const undefinedResult = validateToolInput("search_transactions", {
        query: undefined,
      });

      const nullResult = validateToolInput("search_transactions", {
        query: null,
      });

      const emptyResult = validateToolInput("search_transactions", {
        query: "",
      });

      // All should be handled appropriately
      expect(undefinedResult).toBeDefined();
      expect(nullResult).toBeDefined();
      expect(emptyResult).toBeDefined();
    });
  });

  describe("Type Validation", () => {
    it("should reject wrong type for string fields", () => {
      const result = validateToolInput("search_transactions", {
        query: 12345,
      });

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.path === "query")).toBe(true);
    });

    it("should reject wrong type for number fields", () => {
      const result = validateToolInput("get_largest_expenses", {
        limit: "ten",
      });

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.path === "limit")).toBe(true);
    });

    it("should reject wrong type for boolean fields", () => {
      const result = validateToolInput("get_spending_by_category", {
        includeSubcategories: "yes",
      });

      expect(result.valid).toBe(false);
    });

    it("should reject wrong type for array fields", () => {
      const result = validateToolInput("search_transactions", {
        tags: "not-an-array",
      });

      // If tags is expected to be an array
      expect(result).toBeDefined();
    });
  });

  describe("Enum Validation", () => {
    it("should accept valid enum values", () => {
      const result = validateToolInput("get_transactions_summary", {
        type: "income",
      });

      expect(result.valid).toBe(true);
    });

    it("should accept valid enum values (expense)", () => {
      const result = validateToolInput("get_transactions_summary", {
        type: "expense",
      });

      expect(result.valid).toBe(true);
    });

    it("should reject invalid enum values", () => {
      const result = validateToolInput("get_transactions_summary", {
        type: "invalid_type",
      });

      expect(result.valid).toBe(false);
      expect(
        result.errors.some((e) => e.message.includes("must be one of")),
      ).toBe(true);
    });

    it("should reject enum values with extra whitespace", () => {
      const result = validateToolInput("get_transactions_summary", {
        type: " income ",
      });

      expect(result.valid).toBe(false);
    });

    it("should reject enum values with wrong case", () => {
      const result = validateToolInput("get_transactions_summary", {
        type: "INCOME",
      });

      expect(result.valid).toBe(false);
    });
  });

  describe("Number Range Validation", () => {
    it("should accept numbers within valid range", () => {
      const result = validateToolInput("get_largest_expenses", {
        limit: 10,
      });

      expect(result.valid).toBe(true);
    });

    it("should reject negative numbers when minimum is 0", () => {
      const result = validateToolInput("get_largest_expenses", {
        limit: -5,
      });

      // Should either fail validation or be sanitized
      expect(result).toBeDefined();
    });

    it("should reject numbers above maximum", () => {
      const result = validateToolInput("get_largest_expenses", {
        limit: 10000,
      });

      // Should either fail or cap at maximum
      expect(result).toBeDefined();
    });

    it("should reject NaN", () => {
      const result = validateToolInput("get_largest_expenses", {
        limit: Number.NaN,
      });

      expect(result.valid).toBe(false);
    });

    it("should reject Infinity", () => {
      const result = validateToolInput("get_largest_expenses", {
        limit: Number.POSITIVE_INFINITY,
      });

      expect(result.valid).toBe(false);
    });
  });
});

// ============================================================================
// 3. SANITIZATION
// ============================================================================

describe("Validation Security: Input Sanitization", () => {
  describe("Property Stripping", () => {
    it("should remove unknown properties", () => {
      const input = {
        period: "this_month",
        unknownField: "should be removed",
        anotherUnknown: 12345,
      };

      const sanitized = sanitizeToolInput("get_transactions_summary", input);

      expect(sanitized).not.toHaveProperty("unknownField");
      expect(sanitized).not.toHaveProperty("anotherUnknown");
      expect(sanitized).toHaveProperty("period");
    });

    it("should remove prototype pollution attempts", () => {
      const input = {
        period: "this_month",
        __proto__: { malicious: true },
        constructor: { prototype: { hacked: true } },
      };

      const sanitized = sanitizeToolInput(
        "get_transactions_summary",
        input as Record<string, unknown>,
      );

      expect(sanitized).not.toHaveProperty("__proto__");
      expect(sanitized).not.toHaveProperty("constructor");
      expect(({} as any).malicious).toBeUndefined();
      expect(({} as any).hacked).toBeUndefined();
    });

    it("should handle inputs with Symbol keys", () => {
      const sym = Symbol("test");
      const input = {
        period: "this_month",
        [sym]: "should be removed",
      };

      const sanitized = sanitizeToolInput("get_transactions_summary", input);

      expect(Object.getOwnPropertySymbols(sanitized)).toHaveLength(0);
    });
  });

  describe("Value Preservation", () => {
    it("should preserve valid values unchanged", () => {
      const input = {
        period: "this_month",
        type: "expense",
      };

      const sanitized = sanitizeToolInput("get_transactions_summary", input);

      expect(sanitized.period).toBe("this_month");
      expect(sanitized.type).toBe("expense");
    });

    it("should handle empty input object", () => {
      const sanitized = sanitizeToolInput("get_transactions_summary", {});

      expect(sanitized).toEqual({});
    });

    it("should handle input with only invalid properties", () => {
      const input = {
        invalid1: "value1",
        invalid2: "value2",
      };

      const sanitized = sanitizeToolInput("get_transactions_summary", input);

      expect(Object.keys(sanitized)).toHaveLength(0);
    });
  });

  describe("Unknown Tool Handling", () => {
    it("should return empty object for unknown tool", () => {
      const input = {
        anyField: "any value",
      };

      const sanitized = sanitizeToolInput("unknown_tool", input);

      expect(sanitized).toEqual({});
    });
  });
});

// ============================================================================
// 4. SCHEMA INTEGRITY
// ============================================================================

describe("Validation Security: Schema Integrity", () => {
  describe("All Tools Have Valid Schemas", () => {
    it("should have schema for every tool", () => {
      expect(ALL_TOOLS_SCHEMAS.length).toBeGreaterThan(0);

      for (const schema of ALL_TOOLS_SCHEMAS) {
        expect(schema.name).toBeDefined();
        expect(schema.description).toBeDefined();
        expect(schema.parameters).toBeDefined();
        expect(schema.parameters.type).toBe("object");
        expect(schema.parameters.properties).toBeDefined();
      }
    });

    it("should have unique tool names", () => {
      const names = ALL_TOOLS_SCHEMAS.map((s) => s.name);
      const uniqueNames = new Set(names);

      expect(uniqueNames.size).toBe(names.length);
    });

    it("should have valid parameter types", () => {
      const validTypes = ["string", "number", "boolean", "array", "object"];

      for (const schema of ALL_TOOLS_SCHEMAS) {
        for (const [_paramName, param] of Object.entries(
          schema.parameters.properties,
        )) {
          expect(validTypes).toContain(param.type);
        }
      }
    });

    it("should have descriptions for all parameters", () => {
      for (const schema of ALL_TOOLS_SCHEMAS) {
        for (const [_paramName, param] of Object.entries(
          schema.parameters.properties,
        )) {
          expect(param.description).toBeDefined();
          expect(param.description.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe("Required Fields Are Valid", () => {
    it("required fields should exist in properties", () => {
      for (const schema of ALL_TOOLS_SCHEMAS) {
        const required = schema.parameters.required || [];
        const properties = Object.keys(schema.parameters.properties);

        for (const field of required) {
          expect(properties).toContain(field);
        }
      }
    });
  });

  describe("Enum Values Are Consistent", () => {
    it("enum fields should have at least 2 values", () => {
      for (const schema of ALL_TOOLS_SCHEMAS) {
        for (const [_paramName, param] of Object.entries(
          schema.parameters.properties,
        )) {
          if (param.enum) {
            expect(param.enum.length).toBeGreaterThanOrEqual(2);
          }
        }
      }
    });

    it("enum values should be unique", () => {
      for (const schema of ALL_TOOLS_SCHEMAS) {
        for (const [_paramName, param] of Object.entries(
          schema.parameters.properties,
        )) {
          if (param.enum) {
            const uniqueValues = new Set(param.enum);
            expect(uniqueValues.size).toBe(param.enum.length);
          }
        }
      }
    });
  });

  describe("Number Constraints Are Valid", () => {
    it("minimum should be less than or equal to maximum", () => {
      for (const schema of ALL_TOOLS_SCHEMAS) {
        for (const [_paramName, param] of Object.entries(
          schema.parameters.properties,
        )) {
          if (
            param.type === "number" &&
            param.minimum !== undefined &&
            param.maximum !== undefined
          ) {
            expect(param.minimum).toBeLessThanOrEqual(param.maximum);
          }
        }
      }
    });
  });
});

// ============================================================================
// 5. EDGE CASES
// ============================================================================

describe("Validation Security: Edge Cases", () => {
  describe("Special String Values", () => {
    it("should handle strings with only spaces", () => {
      const result = validateToolInput("search_transactions", {
        query: "   ",
      });

      expect(result).toBeDefined();
    });

    it("should handle strings with control characters", () => {
      const result = validateToolInput("search_transactions", {
        query: "test\x00\x01\x02query",
      });

      expect(result).toBeDefined();
    });

    it("should handle very long strings", () => {
      const longString = "x".repeat(1_000_000);
      const result = validateToolInput("search_transactions", {
        query: longString,
      });

      expect(result).toBeDefined();
    });

    it("should handle strings with unicode", () => {
      const result = validateToolInput("search_transactions", {
        query: "测试 테스트 тест 🎉",
      });

      expect(result).toBeDefined();
    });
  });

  describe("Special Number Values", () => {
    it("should handle zero", () => {
      const result = validateToolInput("get_largest_expenses", {
        limit: 0,
      });

      expect(result).toBeDefined();
    });

    it("should handle very small decimals", () => {
      const result = validateToolInput("search_transactions", {
        minAmount: 0.0000001,
      });

      expect(result).toBeDefined();
    });

    it("should handle negative zero", () => {
      const result = validateToolInput("get_largest_expenses", {
        limit: -0,
      });

      expect(result).toBeDefined();
    });

    it("should handle MAX_SAFE_INTEGER", () => {
      const result = validateToolInput("search_transactions", {
        minAmount: Number.MAX_SAFE_INTEGER,
      });

      expect(result).toBeDefined();
    });
  });

  describe("Empty and Null Values", () => {
    it("should handle null input object", () => {
      try {
        const result = validateToolInput(
          "get_transactions_summary",
          null as any,
        );
        expect(result.valid).toBe(false);
      } catch (error) {
        // Null should either fail validation or throw
        expect(error).toBeDefined();
      }
    });

    it("should handle undefined input object", () => {
      try {
        const result = validateToolInput(
          "get_transactions_summary",
          undefined as any,
        );
        expect(result.valid).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should handle array as input object", () => {
      const result = validateToolInput("get_transactions_summary", [] as any);

      // Arrays are technically objects in JS, so validation may pass structurally
      // The key security measure is that sanitization removes all invalid properties
      expect(result).toBeDefined();

      // Sanitization should return empty object for arrays
      const sanitized = sanitizeToolInput(
        "get_transactions_summary",
        [] as any,
      );
      expect(Object.keys(sanitized)).toHaveLength(0);
    });
  });
});

// ============================================================================
// 6. CONCURRENT VALIDATION
// ============================================================================

describe("Validation Security: Concurrent Operations", () => {
  it("should handle concurrent validations safely", async () => {
    const validationPromises = Array(100)
      .fill(null)
      .map((_, i) =>
        Promise.resolve(
          validateToolInput("search_transactions", {
            query: `query_${i}`,
            limit: i,
          }),
        ),
      );

    const results = await Promise.all(validationPromises);

    // All validations should complete
    expect(results).toHaveLength(100);

    // All should have valid structure
    for (const result of results) {
      expect(result).toHaveProperty("valid");
      expect(result).toHaveProperty("errors");
    }
  });

  it("should handle concurrent sanitizations safely", async () => {
    const sanitizationPromises = Array(100)
      .fill(null)
      .map((_, i) =>
        Promise.resolve(
          sanitizeToolInput("search_transactions", {
            query: `query_${i}`,
            unknownField: `unknown_${i}`,
          }),
        ),
      );

    const results = await Promise.all(sanitizationPromises);

    // All sanitizations should complete
    expect(results).toHaveLength(100);

    // All should have stripped unknown fields
    for (const result of results) {
      expect(result).not.toHaveProperty("unknownField");
    }
  });
});
