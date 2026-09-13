import { z } from "zod";

const cleanUrl = (val?: string | null, fallback = "https://www.softlabglobal.com") => {
  if (!val || typeof val !== "string" || !val.trim()) return fallback;
  const trimmed = val.trim();
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return `https://${trimmed}`;
  }
  return trimmed;
};

const cleanEmail = (val?: string | null, fallback = "info@softlabglobal.com") => {
  if (!val || typeof val !== "string" || !val.trim() || !val.includes("@")) return fallback;
  return val.trim();
};

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required").default("postgresql://postgres:postgres@localhost:5432/softlab_global?schema=public"),
  DIRECT_URL: z.string().optional(),
  NEXTAUTH_SECRET: z.string().min(16, "NEXTAUTH_SECRET must be at least 16 characters").default("softlab_global_production_secret_key_2026_secure"),
  NEXTAUTH_URL: z.string().optional().default("https://www.softlabglobal.com"),
  INITIAL_SUPER_ADMIN_EMAIL: z.string().optional().default("admin@softlabglobal.com"),
  INITIAL_SUPER_ADMIN_PASSWORD: z.string().min(8).optional(),
  INITIAL_SUPER_ADMIN_NAME: z.string().optional().default("Super Administrator"),
  SEED_SUPER_ADMIN_PASSWORD: z.string().min(8).optional(),
  SEED_TRAINER_PASSWORD: z.string().min(8).optional(),
  SEED_STUDENT_PASSWORD: z.string().min(8).optional(),
  RESET_SEED_PASSWORDS: z.string().optional().default("false"),
  NEXT_PUBLIC_APP_URL: z.string().optional().default("https://www.softlabglobal.com"),
  NEXT_PUBLIC_APP_NAME: z.string().optional().default("SOFTLAB GLOBAL"),
  NEXT_PUBLIC_SUPPORT_PHONE: z.string().optional().default("9196596975"),
  NEXT_PUBLIC_SUPPORT_EMAIL: z.string().optional().default("info@softlabglobal.com"),
  PAYMENT_PROVIDER: z.string().optional().default("RAZORPAY"),
  RAZORPAY_KEY_ID: z.string().optional().default(""),
  RAZORPAY_KEY_SECRET: z.string().optional().default(""),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional().default(""),
  NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string().optional().default(""),
});

export const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL || process.env.DATABASE_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  NEXTAUTH_URL: cleanUrl(process.env.NEXTAUTH_URL || process.env.AUTH_URL),
  INITIAL_SUPER_ADMIN_EMAIL: cleanEmail(process.env.INITIAL_SUPER_ADMIN_EMAIL, "admin@softlabglobal.com"),
  INITIAL_SUPER_ADMIN_PASSWORD: process.env.INITIAL_SUPER_ADMIN_PASSWORD,
  INITIAL_SUPER_ADMIN_NAME: process.env.INITIAL_SUPER_ADMIN_NAME,
  SEED_SUPER_ADMIN_PASSWORD: process.env.SEED_SUPER_ADMIN_PASSWORD,
  SEED_TRAINER_PASSWORD: process.env.SEED_TRAINER_PASSWORD,
  SEED_STUDENT_PASSWORD: process.env.SEED_STUDENT_PASSWORD,
  RESET_SEED_PASSWORDS: process.env.RESET_SEED_PASSWORDS,
  NEXT_PUBLIC_APP_URL: cleanUrl(process.env.NEXT_PUBLIC_APP_URL),
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || "SOFTLAB GLOBAL",
  NEXT_PUBLIC_SUPPORT_PHONE: process.env.NEXT_PUBLIC_SUPPORT_PHONE || "9196596975",
  NEXT_PUBLIC_SUPPORT_EMAIL: cleanEmail(process.env.NEXT_PUBLIC_SUPPORT_EMAIL, "info@softlabglobal.com"),
  PAYMENT_PROVIDER: process.env.PAYMENT_PROVIDER || "RAZORPAY",
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || "",
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || "",
  NEXT_PUBLIC_RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || "",
});
