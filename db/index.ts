import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export function getDb() {
  if (!env.DB) {
    throw new Error("Secure admin storage is not connected yet.");
  }
  return drizzle(env.DB, { schema });
}
