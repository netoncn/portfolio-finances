export function removeUndefinedFields<T extends Record<string, unknown>>(
  obj: T,
): Partial<T> {
  const result: Partial<T> = {};

  for (const key in obj) {
    if (obj[key] !== undefined) {
      result[key] = obj[key];
    }
  }

  return result;
}

export function deepRemoveUndefinedFields<T extends Record<string, unknown>>(
  obj: T,
): Partial<T> {
  const result: Partial<T> = {};

  for (const key in obj) {
    const value = obj[key];

    if (value === undefined) {
      continue;
    }

    if (value && typeof value === "object" && !Array.isArray(value)) {
      result[key] = deepRemoveUndefinedFields(
        value as Record<string, unknown>,
      ) as T[Extract<keyof T, string>];
    } else {
      result[key] = value;
    }
  }

  return result;
}
