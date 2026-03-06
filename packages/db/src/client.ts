import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error("DATABASE_URL is required to initialize @regista/db");
}

export const sqlClient = postgres(connectionString);

export const db = drizzle(sqlClient, { schema });
