import { config } from "../config.js";
import { createPool } from "../db/client.js";

const pool = createPool(config.databaseUrl);

try {
  const result = await pool.query("SELECT NOW() AS connected_at, current_database() AS database_name");
  const row = result.rows[0];

  console.log(
    JSON.stringify(
      {
        ok: true,
        database: row.database_name,
        connectedAt: row.connected_at
      },
      null,
      2
    )
  );
} finally {
  await pool.end();
}
