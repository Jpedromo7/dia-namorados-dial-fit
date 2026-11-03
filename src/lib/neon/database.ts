import "server-only";

import { neon } from "@neondatabase/serverless";
import { BlackFridayDatabaseError } from "@/lib/black-friday-db-errors";

let cachedUrl = "";
let cachedSql: ReturnType<typeof neon> | null = null;

export function getNeonSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new BlackFridayDatabaseError("O banco da pré-lista não está configurado.", 503);
  if (url !== cachedUrl || !cachedSql) {
    cachedUrl = url;
    cachedSql = neon(url);
  }
  return cachedSql;
}

export async function queryNeon<T extends Record<string, unknown>>(statement: string, parameters: unknown[] = []) {
  return await getNeonSql().query(statement, parameters) as T[];
}
