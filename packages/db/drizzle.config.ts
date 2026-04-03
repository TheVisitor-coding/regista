import { config } from 'dotenv';
import { resolve } from 'path';
import { defineConfig } from "drizzle-kit";

// Load .env from monorepo root
config({ path: resolve(__dirname, '../../.env') });

const databaseUrl = process.env.DATABASE_URL;

export default defineConfig({
  schema: "./dist/schema/*.js",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl!,
  },
});
