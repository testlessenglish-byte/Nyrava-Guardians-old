import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export function getDb() {
  const env: any = typeof globalThis !== "undefined" ? (globalThis as any).__cf_env || (process as any)?.env : null;
  if (!env || !env.DB) {
    throw new Error("Secure admin storage is not connected yet.");
  }
  return drizzle(env.DB, { schema });
}
