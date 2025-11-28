import type { ToolDefinition, ToolParameter } from "./base.types";
import { ALL_TOOLS_SCHEMAS } from "./index";

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  path: string;
  message: string;
  value?: unknown;
}

export function validateToolInput(
  toolName: string,
  input: Record<string, unknown>,
): ValidationResult {
  const toolDef = ALL_TOOLS_SCHEMAS.find((t) => t.name === toolName);

  if (!toolDef) {
    return {
      valid: false,
      errors: [{ path: "", message: `Unknown tool: ${toolName}` }],
    };
  }

  return validateAgainstSchema(input, toolDef.parameters, "");
}

function validateAgainstSchema(
  value: unknown,
  schema: ToolDefinition["parameters"],
  path: string,
): ValidationResult {
  const errors: ValidationError[] = [];

  if (schema.type === "object") {
    if (typeof value !== "object" || value === null) {
      errors.push({
        path: path || "root",
        message: "Expected an object",
        value,
      });
      return { valid: false, errors };
    }

    const obj = value as Record<string, unknown>;

    if (schema.required) {
      for (const field of schema.required) {
        if (!(field in obj) || obj[field] === undefined) {
          errors.push({
            path: path ? `${path}.${field}` : field,
            message: `Required field "${field}" is missing`,
          });
        }
      }
    }

    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        if (key in obj && obj[key] !== undefined) {
          const propPath = path ? `${path}.${key}` : key;
          const propResult = validateProperty(
            obj[key],
            propSchema as ToolParameter,
            propPath,
          );
          errors.push(...propResult.errors);
        }
      }
    }
    return { valid: errors.length === 0, errors };
  }

  return { valid: true, errors: [] };
}

function validateProperty(
  value: unknown,
  schema: ToolParameter,
  path: string,
): ValidationResult {
  const errors: ValidationError[] = [];

  switch (schema.type) {
    case "string":
      if (typeof value !== "string") {
        errors.push({
          path,
          message: `Expected string, got ${typeof value}`,
          value,
        });
        break;
      }
      if (schema.enum && !schema.enum.includes(value)) {
        errors.push({
          path,
          message: `Value must be one of: ${schema.enum.join(", ")}`,
          value,
        });
      }
      break;

    case "number":
      if (typeof value !== "number" || Number.isNaN(value)) {
        errors.push({
          path,
          message: `Expected number, got ${typeof value}`,
          value,
        });
        break;
      }
      if (schema.minimum !== undefined && value < schema.minimum) {
        errors.push({
          path,
          message: `Value must be >= ${schema.minimum}`,
          value,
        });
      }
      if (schema.maximum !== undefined && value > schema.maximum) {
        errors.push({
          path,
          message: `Value must be <= ${schema.maximum}`,
          value,
        });
      }
      break;

    case "boolean":
      if (typeof value !== "boolean") {
        errors.push({
          path,
          message: `Expected boolean, got ${typeof value}`,
          value,
        });
      }
      break;

    case "array":
      if (!Array.isArray(value)) {
        errors.push({
          path,
          message: `Expected array, got ${typeof value}`,
          value,
        });
        break;
      }
      if (schema.items) {
        for (let i = 0; i < value.length; i++) {
          const itemResult = validateProperty(
            value[i],
            schema.items,
            `${path}[${i}]`,
          );
          errors.push(...itemResult.errors);
        }
      }
      break;

    case "object":
      if (typeof value !== "object" || value === null || Array.isArray(value)) {
        errors.push({
          path,
          message: `Expected object, got ${typeof value}`,
          value,
        });
        break;
      }
      if (schema.properties) {
        const result = validateAgainstSchema(
          value,
          { type: "object", properties: schema.properties },
          path,
        );
        errors.push(...result.errors);
      }
      break;
  }

  return { valid: errors.length === 0, errors };
}

export function sanitizeToolInput(
  toolName: string,
  input: Record<string, unknown>,
): Record<string, unknown> {
  const toolDef = ALL_TOOLS_SCHEMAS.find((t) => t.name === toolName);

  if (!toolDef) {
    return {};
  }

  const sanitized: Record<string, unknown> = {};
  const allowedKeys = Object.keys(toolDef.parameters.properties);

  for (const key of allowedKeys) {
    if (key in input && input[key] !== undefined) {
      sanitized[key] = input[key];
    }
  }

  return sanitized;
}

export function getRequiredParams(toolName: string): string[] {
  const toolDef = ALL_TOOLS_SCHEMAS.find((t) => t.name === toolName);
  return toolDef?.parameters.required || [];
}
