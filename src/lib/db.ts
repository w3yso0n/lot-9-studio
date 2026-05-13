import { Pool } from "pg";

function connectionStringWithUtf8(url: string): string {
  if (/[?&]client_encoding=/i.test(url)) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}client_encoding=UTF8`;
}

const globalForPg = globalThis as unknown as { pgPool: Pool | undefined };

export function getPool(): Pool {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL no está definida. Copia .env.example a .env y configura la conexión."
    );
  }
  if (!globalForPg.pgPool) {
    globalForPg.pgPool = new Pool({
      connectionString: connectionStringWithUtf8(url),
      max: 10,
    });
  }
  return globalForPg.pgPool;
}
