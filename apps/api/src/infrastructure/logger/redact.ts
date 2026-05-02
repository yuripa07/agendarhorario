const sensitiveKeys = new Set(["authorization", "cookie", "password", "token", "secret"]);

export function redact<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => redact(item)) as T;
  }

  if (value === null || typeof value !== "object") {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      sensitiveKeys.has(key.toLowerCase()) ? "[redacted]" : redact(entry),
    ]),
  ) as T;
}
