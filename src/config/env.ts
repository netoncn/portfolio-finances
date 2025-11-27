import { z } from "zod";

// ==================== CLIENT ENV (públicas) ====================
const clientEnvSchema = z.object({
  // Firebase Client
  NEXT_PUBLIC_FIREBASE_API_KEY: z
    .string()
    .min(1, "Firebase API Key é obrigatória"),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z
    .string()
    .min(1, "Firebase Auth Domain é obrigatório"),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z
    .string()
    .min(1, "Firebase Project ID é obrigatório"),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().optional(),

  // App Config
  NEXT_PUBLIC_APP_URL: z.string().url("URL da aplicação deve ser válida"),
  NEXT_PUBLIC_APP_ENV: z
    .enum(["development", "preview", "production"])
    .default("development"),

  // Feature Flags
  NEXT_PUBLIC_ENABLE_AI_FEATURES: z.string().optional().default("true"),
  NEXT_PUBLIC_USE_FIREBASE_EMULATOR: z.string().optional().default("false"),
});

// ==================== SERVER ENV (privadas) ====================
const serverEnvSchema = z.object({
  // Firebase Admin
  FIREBASE_PROJECT_ID: z
    .string()
    .min(1, "Firebase Project ID (server) é obrigatório"),
  FIREBASE_CLIENT_EMAIL: z
    .string()
    .email("Firebase Client Email deve ser válido"),
  FIREBASE_PRIVATE_KEY: z.string().min(1, "Firebase Private Key é obrigatória"),

  // NextAuth
  NEXTAUTH_SECRET: z
    .string()
    .min(32, "NextAuth Secret deve ter pelo menos 32 caracteres"),
  NEXTAUTH_URL: z.string().url("NextAuth URL deve ser válida"),
  NEXTAUTH_DEBUG: z.string().optional().default("false"),

  // OAuth Providers
  GOOGLE_CLIENT_ID: z.string().min(1, "Google Client ID é obrigatório"),
  GOOGLE_CLIENT_SECRET: z.string().min(1, "Google Client Secret é obrigatório"),

  // AI / LLM - Provider agnostic configuration
  LLM_PROVIDER: z.enum(["openai", "anthropic", "google"]).default("openai"),

  // OpenAI
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().optional().default("gpt-4o-mini"),

  // Anthropic (Claude)
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().optional().default("claude-3-5-sonnet-20241022"),

  // Google (Gemini)
  GOOGLE_AI_API_KEY: z.string().optional(),
  GOOGLE_MODEL: z.string().optional().default("gemini-1.5-flash"),

  // AI Usage Quota
  AI_QUOTA_ENABLED: z
    .string()
    .optional()
    .default("true")
    .transform((val) => val === "true"),
  AI_QUOTA_MAX_REQUESTS_PER_MONTH: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined)),
  AI_QUOTA_MAX_TOKENS_PER_MONTH: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined)),
  AI_QUOTA_MAX_COST_PER_MONTH: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined)),

  // Outras configs
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

// ==================== VALIDAÇÃO E EXPORT ====================

export function getClientEnv() {
  const parsed = clientEnvSchema.safeParse({
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID:
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
    NEXT_PUBLIC_ENABLE_AI_FEATURES: process.env.NEXT_PUBLIC_ENABLE_AI_FEATURES,
    NEXT_PUBLIC_USE_FIREBASE_EMULATOR:
      process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR,
  });

  if (!parsed.success) {
    console.error("❌ Erro na validação de variáveis de ambiente (CLIENT):");
    console.error(parsed.error.flatten().fieldErrors);
    throw new Error("Variáveis de ambiente inválidas (CLIENT)");
  }

  return parsed.data;
}

export function getServerEnv() {
  const SKIP = process.env.SKIP_ENV_VALIDATION === "true";
  if (SKIP) {
    throw new Error(
      "Acesso a server env durante o build (SKIP_ENV_VALIDATION=true).",
    );
  }

  if (typeof window !== "undefined") {
    throw new Error("getServerEnv() não pode ser chamado no browser!");
  }

  const parsed = serverEnvSchema.safeParse({
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_DEBUG: process.env.NEXTAUTH_DEBUG,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    LLM_PROVIDER: process.env.LLM_PROVIDER,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_MODEL: process.env.OPENAI_MODEL,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL,
    GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY,
    GOOGLE_MODEL: process.env.GOOGLE_MODEL,
    AI_QUOTA_ENABLED: process.env.AI_QUOTA_ENABLED,
    AI_QUOTA_MAX_REQUESTS_PER_MONTH:
      process.env.AI_QUOTA_MAX_REQUESTS_PER_MONTH,
    AI_QUOTA_MAX_TOKENS_PER_MONTH: process.env.AI_QUOTA_MAX_TOKENS_PER_MONTH,
    AI_QUOTA_MAX_COST_PER_MONTH: process.env.AI_QUOTA_MAX_COST_PER_MONTH,
    NODE_ENV: process.env.NODE_ENV,
  });

  if (!parsed.success) {
    console.error("❌ Erro na validação de variáveis de ambiente (SERVER):");
    console.error(parsed.error.flatten().fieldErrors);
    throw new Error("Variáveis de ambiente inválidas (SERVER)");
  }

  return parsed.data;
}

export type ClientEnv = z.infer<typeof clientEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function isProduction() {
  return process.env.NODE_ENV === "production";
}

export function isDevelopment() {
  return process.env.NODE_ENV === "development";
}

export function isFeatureEnabled(feature: keyof ClientEnv) {
  const env = getClientEnv();
  return env[feature] === "true";
}

// Unified env export for convenience
export const env = {
  get client() {
    return getClientEnv();
  },
  get server() {
    return getServerEnv();
  },
};
