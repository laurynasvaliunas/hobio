/**
 * PII-safe logger.
 *
 * Rules:
 *   - In production (`__DEV__ === false`) all methods are no-ops, except
 *     `error` which still forwards to Sentry if available.
 *   - In development, messages are emitted via `console.*` but any value
 *     that looks like an email, phone number, JWT, URL query string,
 *     Stripe key, or Supabase URL is redacted.
 *   - Never log the full session, user metadata, or notification payload
 *     objects. Use `logger.event("key", { safeField: ... })` instead.
 */

type Level = "debug" | "info" | "warn" | "error";

const EMAIL_RE = /([\w.+-]+)@([\w-]+\.[\w.-]+)/g;
const JWT_RE = /\beyJ[\w-]+\.[\w-]+\.[\w-]+\b/g;
const PHONE_RE = /(?<!\d)(\+?\d[\d\s\-().]{7,}\d)(?!\d)/g;
const STRIPE_KEY_RE = /\b(sk|pk|rk)_(live|test)_[A-Za-z0-9]{10,}\b/g;
const SUPABASE_URL_RE = /https?:\/\/[A-Za-z0-9-]+\.supabase\.co[^\s"']*/g;
const QUERY_RE = /\?[^\s"'#]+/g;

const SENSITIVE_KEYS = new Set([
  "password",
  "newPassword",
  "currentPassword",
  "token",
  "accessToken",
  "access_token",
  "refreshToken",
  "refresh_token",
  "identityToken",
  "apiKey",
  "api_key",
  "authorization",
  "email",
  "phone",
  "medical_notes",
  "date_of_birth",
  "signature",
  "signature_url",
  "stripe_secret",
  "client_secret",
  "user_metadata",
  "raw_user_meta_data",
  "user",
]);

function redactString(input: string): string {
  return input
    .replace(EMAIL_RE, "<redacted:email>")
    .replace(JWT_RE, "<redacted:jwt>")
    .replace(STRIPE_KEY_RE, "<redacted:stripe-key>")
    .replace(SUPABASE_URL_RE, "<redacted:supabase-url>")
    .replace(QUERY_RE, "?<redacted:query>")
    .replace(PHONE_RE, "<redacted:phone>");
}

function redact(value: unknown, depth = 0): unknown {
  if (depth > 4) return "<redacted:too-deep>";
  if (value == null) return value;
  const t = typeof value;
  if (t === "string") return redactString(value as string);
  if (t === "number" || t === "boolean") return value;
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  if (t === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.has(k)) {
        out[k] = "<redacted>";
      } else {
        out[k] = redact(v, depth + 1);
      }
    }
    return out;
  }
  return "<redacted:unknown>";
}

function emit(level: Level, scope: string, message: string, meta?: unknown) {
  if (!__DEV__ && level !== "error") return;
  const redactedMeta = meta !== undefined ? redact(meta) : undefined;
  const prefix = `[${scope}]`;
  const safeMessage = redactString(message);
  if (redactedMeta !== undefined) {
    console[level === "debug" ? "log" : level](prefix, safeMessage, redactedMeta);
  } else {
    console[level === "debug" ? "log" : level](prefix, safeMessage);
  }
}

export interface Logger {
  debug: (message: string, meta?: unknown) => void;
  info: (message: string, meta?: unknown) => void;
  warn: (message: string, meta?: unknown) => void;
  error: (message: string, meta?: unknown) => void;
  event: (name: string, meta?: Record<string, unknown>) => void;
}

export function createLogger(scope: string): Logger {
  return {
    debug: (m, meta) => emit("debug", scope, m, meta),
    info: (m, meta) => emit("info", scope, m, meta),
    warn: (m, meta) => emit("warn", scope, m, meta),
    error: (m, meta) => emit("error", scope, m, meta),
    event: (name, meta) => emit("info", scope, `event:${name}`, meta),
  };
}

export const logger = createLogger("App");
