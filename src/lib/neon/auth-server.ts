import "server-only";

import { createNeonAuth } from "@neon/auth/next/server";

export function getNeonAuth() {
  const baseUrl = process.env.NEON_AUTH_BASE_URL;
  const secret = process.env.NEON_AUTH_COOKIE_SECRET;
  if (!baseUrl || !secret || secret.length < 32) return null;
  return createNeonAuth({ baseUrl, cookies: { secret, sessionDataTtl: 120 }, logLevel: "silent" });
}
