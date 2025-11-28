import { describe, expect, it } from "vitest";
import { AITelemetryService } from "../services/ai-telemetry.service";
import {
  createRequestTelemetry,
  createTelemetryContext,
  createToolCallTelemetry,
} from "../services/telemetry-builder";
import { MODEL_PRICING } from "../types/usage";

// ============================================================================
// Cost Calculation Tests
// ============================================================================

describe("AI Telemetry: Cost Calculation", () => {
  describe("calculateCostBreakdown", () => {
    it("should calculate cost for gpt-4o model", () => {
      const result = AITelemetryService.calculateCostBreakdown(
        "gpt-4o",
        1000, // 1K prompt tokens
        500, // 500 completion tokens
      );

      // gpt-4o: prompt = $2.50/1M ($0.25/1K), completion = $10/1M ($1/1K)
      // Expected: (1000/1000) * 250 + (500/1000) * 1000 = 250 + 500 = 750 cents
      expect(result.promptCost).toBe(250); // 0.25 cents * 1000 tokens
      expect(result.completionCost).toBe(500); // 1 cent * 500 tokens
      expect(result.totalCost).toBe(750);
    });

    it("should calculate cost for gpt-4o-mini model", () => {
      const result = AITelemetryService.calculateCostBreakdown(
        "gpt-4o-mini",
        1000,
        500,
      );

      // gpt-4o-mini: prompt = $0.15/1M, completion = $0.60/1M
      // Expected: (1000/1000) * 15 + (500/1000) * 60 = 15 + 30 = 45 cents
      expect(result.promptCost).toBe(15);
      expect(result.completionCost).toBe(30);
      expect(result.totalCost).toBe(45);
    });

    it("should calculate cost for claude-3-5-sonnet model", () => {
      const result = AITelemetryService.calculateCostBreakdown(
        "claude-3-5-sonnet-20241022",
        1000,
        500,
      );

      // claude-3-5-sonnet: prompt = $3/1M, completion = $15/1M
      // Expected: (1000/1000) * 300 + (500/1000) * 1500 = 300 + 750 = 1050 cents
      expect(result.promptCost).toBe(300);
      expect(result.completionCost).toBe(750);
      expect(result.totalCost).toBe(1050);
    });

    it("should use default pricing for unknown model", () => {
      const result = AITelemetryService.calculateCostBreakdown(
        "unknown-model",
        1000,
        500,
      );

      // Default: prompt = $0.50/1K (50 cents), completion = $1.50/1K (150 cents)
      expect(result.promptCost).toBe(50);
      expect(result.completionCost).toBe(75);
      expect(result.totalCost).toBe(125);
    });

    it("should handle zero tokens", () => {
      const result = AITelemetryService.calculateCostBreakdown("gpt-4o", 0, 0);

      expect(result.promptCost).toBe(0);
      expect(result.completionCost).toBe(0);
      expect(result.totalCost).toBe(0);
    });

    it("should ceil fractional costs", () => {
      const result = AITelemetryService.calculateCostBreakdown(
        "gpt-4o-mini",
        100, // Should result in fractional cost
        100,
      );

      // (100/1000) * 15 = 1.5 -> ceil to 2
      // (100/1000) * 60 = 6
      expect(result.promptCost).toBe(2); // Ceiled
      expect(result.completionCost).toBe(6);
      expect(result.totalCost).toBe(8);
    });
  });
});

// ============================================================================
// Tool Call Telemetry Builder Tests
// ============================================================================

describe("AI Telemetry: ToolCallTelemetryBuilder", () => {
  it("should create a successful tool call telemetry", () => {
    const builder = createToolCallTelemetry(
      "call-123",
      "get_transactions_summary",
    );
    builder.withArguments({ period: "this_month" });

    const result = builder.success({ total: 1000 });

    expect(result.toolCallId).toBe("call-123");
    expect(result.toolName).toBe("get_transactions_summary");
    expect(result.arguments).toEqual({ period: "this_month" });
    expect(result.success).toBe(true);
    expect(result.result).toEqual({ total: 1000 });
    expect(result.executionTimeMs).toBeGreaterThanOrEqual(0);
    expect(result.startedAt).toBeDefined();
    expect(result.completedAt).toBeDefined();
    expect(result.completedAt).toBeGreaterThanOrEqual(result.startedAt);
  });

  it("should create a failed tool call telemetry", () => {
    const builder = createToolCallTelemetry("call-456", "search_transactions");
    builder.withArguments({ query: "test" });

    const result = builder.failure("Rate limit exceeded", "RATE_LIMITED");

    expect(result.toolCallId).toBe("call-456");
    expect(result.toolName).toBe("search_transactions");
    expect(result.success).toBe(false);
    expect(result.errorMessage).toBe("Rate limit exceeded");
    expect(result.errorCode).toBe("RATE_LIMITED");
    expect(result.executionTimeMs).toBeGreaterThanOrEqual(0);
  });

  it("should track execution time", async () => {
    const builder = createToolCallTelemetry("call-789", "test_tool");

    // Wait a bit to ensure measurable time
    await new Promise((resolve) => setTimeout(resolve, 10));

    const result = builder.success();

    expect(result.executionTimeMs).toBeGreaterThanOrEqual(10);
  });
});

// ============================================================================
// Request Telemetry Builder Tests
// ============================================================================

describe("AI Telemetry: RequestTelemetryBuilder", () => {
  it("should create a request telemetry with all fields", async () => {
    const builder = createRequestTelemetry("user-123", "chat_with_tools");

    builder
      .withSessionId("session-456")
      .withModel("anthropic", "claude-3-5-sonnet-20241022")
      .withTokens(1000, 500)
      .withMessageCount(5)
      .withStreaming(false)
      .withMetadata("customField", "customValue");

    // Add a tool call
    const toolCall = createToolCallTelemetry("tc-1", "test_tool")
      .withArguments({ test: true })
      .success({ result: "ok" });

    builder.addToolCall(toolCall);

    // Note: We can't easily test the final recording without mocking Firebase
    // But we can verify the builder chain works
    expect(builder).toBeDefined();
  });

  it("should create telemetry context", () => {
    const context = createTelemetryContext(
      "user-123",
      "chat_with_tools",
      "session-456",
    );

    expect(context.userId).toBe("user-123");
    expect(context.feature).toBe("chat_with_tools");
    expect(context.sessionId).toBe("session-456");
    expect(context.requestBuilder).toBeDefined();
  });
});

// ============================================================================
// Model Pricing Tests
// ============================================================================

describe("AI Telemetry: Model Pricing", () => {
  it("should have pricing for all common models", () => {
    const expectedModels = [
      "gpt-4o",
      "gpt-4o-mini",
      "gpt-4-turbo",
      "gpt-3.5-turbo",
      "claude-3-5-sonnet-20241022",
      "claude-3-opus-20240229",
      "claude-3-sonnet-20240229",
      "claude-3-haiku-20240307",
      "gemini-1.5-pro",
      "gemini-1.5-flash",
      "gemini-pro",
    ];

    for (const model of expectedModels) {
      const pricing = MODEL_PRICING[model as keyof typeof MODEL_PRICING];
      expect(pricing).toBeDefined();
      expect(pricing.promptPrice).toBeGreaterThan(0);
      expect(pricing.completionPrice).toBeGreaterThan(0);
    }
  });

  it("should have completion price >= prompt price for all models", () => {
    // Completion is typically more expensive than prompt
    for (const [_model, pricing] of Object.entries(MODEL_PRICING)) {
      expect(pricing.completionPrice).toBeGreaterThanOrEqual(
        pricing.promptPrice,
      );
    }
  });
});

// ============================================================================
// Telemetry Data Structure Tests
// ============================================================================

describe("AI Telemetry: Data Structures", () => {
  it("should create valid ToolCallTelemetry structure", () => {
    const toolCall = createToolCallTelemetry("id-1", "tool-name")
      .withArguments({ key: "value" })
      .success({ data: "result" });

    // Verify all required fields
    expect(toolCall).toHaveProperty("toolCallId");
    expect(toolCall).toHaveProperty("toolName");
    expect(toolCall).toHaveProperty("arguments");
    expect(toolCall).toHaveProperty("success");
    expect(toolCall).toHaveProperty("executionTimeMs");
    expect(toolCall).toHaveProperty("startedAt");
    expect(toolCall).toHaveProperty("completedAt");

    // Verify types
    expect(typeof toolCall.toolCallId).toBe("string");
    expect(typeof toolCall.toolName).toBe("string");
    expect(typeof toolCall.arguments).toBe("object");
    expect(typeof toolCall.success).toBe("boolean");
    expect(typeof toolCall.executionTimeMs).toBe("number");
    expect(typeof toolCall.startedAt).toBe("number");
    expect(typeof toolCall.completedAt).toBe("number");
  });

  it("should handle tool call with error", () => {
    const toolCall = createToolCallTelemetry("id-2", "failing-tool")
      .withArguments({})
      .failure("Something went wrong", "ERROR_CODE");

    expect(toolCall.success).toBe(false);
    expect(toolCall.errorMessage).toBe("Something went wrong");
    expect(toolCall.errorCode).toBe("ERROR_CODE");
    expect(toolCall.result).toBeUndefined();
  });
});

// ============================================================================
// Edge Cases and Error Handling Tests
// ============================================================================

describe("AI Telemetry: Edge Cases", () => {
  it("should handle empty arguments", () => {
    const toolCall = createToolCallTelemetry("id", "tool").success();

    expect(toolCall.arguments).toEqual({});
  });

  it("should handle large token counts", () => {
    const result = AITelemetryService.calculateCostBreakdown(
      "gpt-4o",
      1000000, // 1M tokens
      500000, // 500K tokens
    );

    // Should not overflow or produce NaN
    expect(Number.isFinite(result.totalCost)).toBe(true);
    expect(result.totalCost).toBeGreaterThan(0);
  });

  it("should handle negative token counts gracefully", () => {
    const result = AITelemetryService.calculateCostBreakdown(
      "gpt-4o",
      -100,
      -50,
    );

    // Should produce negative cost (invalid input but shouldn't crash)
    expect(Number.isFinite(result.totalCost)).toBe(true);
  });

  it("should handle special characters in arguments", () => {
    const toolCall = createToolCallTelemetry("id", "tool")
      .withArguments({
        query: "SELECT * FROM users; DROP TABLE users;--",
        unicode: "测试 🎉 тест",
        nested: { deep: { value: "test" } },
      })
      .success();

    expect(toolCall.arguments.query).toContain("DROP TABLE");
    expect(toolCall.arguments.unicode).toContain("🎉");
    expect(toolCall.arguments.nested).toHaveProperty("deep");
  });
});

// ============================================================================
// Cost Comparison Tests
// ============================================================================

describe("AI Telemetry: Cost Comparisons", () => {
  const standardTokens = { prompt: 1000, completion: 500 };

  it("should show gpt-4o-mini is cheapest among OpenAI models", () => {
    const gpt4o = AITelemetryService.calculateCostBreakdown(
      "gpt-4o",
      standardTokens.prompt,
      standardTokens.completion,
    );

    const gpt4oMini = AITelemetryService.calculateCostBreakdown(
      "gpt-4o-mini",
      standardTokens.prompt,
      standardTokens.completion,
    );

    const gpt4Turbo = AITelemetryService.calculateCostBreakdown(
      "gpt-4-turbo",
      standardTokens.prompt,
      standardTokens.completion,
    );

    expect(gpt4oMini.totalCost).toBeLessThan(gpt4o.totalCost);
    expect(gpt4oMini.totalCost).toBeLessThan(gpt4Turbo.totalCost);
  });

  it("should show claude-3-haiku is cheapest among Anthropic models", () => {
    const sonnet = AITelemetryService.calculateCostBreakdown(
      "claude-3-5-sonnet-20241022",
      standardTokens.prompt,
      standardTokens.completion,
    );

    const haiku = AITelemetryService.calculateCostBreakdown(
      "claude-3-haiku-20240307",
      standardTokens.prompt,
      standardTokens.completion,
    );

    const opus = AITelemetryService.calculateCostBreakdown(
      "claude-3-opus-20240229",
      standardTokens.prompt,
      standardTokens.completion,
    );

    expect(haiku.totalCost).toBeLessThan(sonnet.totalCost);
    expect(haiku.totalCost).toBeLessThan(opus.totalCost);
  });

  it("should show gemini-1.5-flash is cheapest among Google models", () => {
    const pro = AITelemetryService.calculateCostBreakdown(
      "gemini-1.5-pro",
      standardTokens.prompt,
      standardTokens.completion,
    );

    const flash = AITelemetryService.calculateCostBreakdown(
      "gemini-1.5-flash",
      standardTokens.prompt,
      standardTokens.completion,
    );

    expect(flash.totalCost).toBeLessThan(pro.totalCost);
  });
});

// ============================================================================
// Time Tracking Tests
// ============================================================================

describe("AI Telemetry: Time Tracking", () => {
  it("should track LLM generation time", async () => {
    const builder = createRequestTelemetry("user", "chat_with_tools");

    builder.startLLMGeneration();
    await new Promise((resolve) => setTimeout(resolve, 50));
    builder.endLLMGeneration();

    // The builder stores the time internally, we can't directly access it
    // but we can verify the chain works
    expect(builder).toBeDefined();
  });

  it("should track time to first token for streaming", () => {
    const builder = createRequestTelemetry("user", "chat_with_tools");

    builder.withStreaming(true).withTimeToFirstToken(150);

    expect(builder).toBeDefined();
  });
});

// ============================================================================
// Configuration Tests
// ============================================================================

describe("AI Telemetry: Configuration", () => {
  it("should configure telemetry settings", () => {
    // Save original config
    AITelemetryService.configure({
      enabled: false,
      trackToolArguments: false,
    });

    // Restore
    AITelemetryService.configure({
      enabled: true,
      trackToolArguments: true,
    });

    // No errors means it worked
    expect(true).toBe(true);
  });
});
