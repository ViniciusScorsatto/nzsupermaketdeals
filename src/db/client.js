import pg from "pg";

const { Pool } = pg;

export function createPool(connectionString) {
  return new Pool({
    connectionString,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
  });
}
