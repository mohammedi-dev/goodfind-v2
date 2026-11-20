import type { Config } from "drizzle-kit";
import "dotenv/config";

const url = process.env.TURSO_DATABASE_URL;
if (!url) throw new Error("TURSO_DATABASE_URL environment variable is not set");

const databaseConfig = url.startsWith("file:")
  ? { dbCredentials: { url } }
  : { driver: "turso" as const, dbCredentials: { url, authToken: process.env.TURSO_AUTH_TOKEN } };

export default {
  schema: "./db/schema.ts",
  out: "./migrations",
  dialect: "sqlite",
  ...databaseConfig,
} satisfies Config;
