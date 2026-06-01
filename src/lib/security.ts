import { NextResponse } from "next/server";

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const rateLimitBuckets = new Map<string, RateLimitBucket>();

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

export function getSafeRedirectPath(
  value: string | null,
  fallback = "/admin",
) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  try {
    const url = new URL(value, "https://dialfit.local");
    const path = `${url.pathname}${url.search}${url.hash}`;

    if (url.origin !== "https://dialfit.local") {
      return fallback;
    }

    if (url.pathname === "/" || url.pathname.startsWith("/admin")) {
      return path;
    }
  } catch {
    return fallback;
  }

  return fallback;
}

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");

  if (!origin) {
    return;
  }

  const requestOrigin = new URL(request.url).origin;

  if (origin !== requestOrigin) {
    throw new HttpError(403, "Origem da requisição não permitida.");
  }
}

function getClientIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local"
  );
}

export function enforceRateLimit(
  request: Request,
  bucketName: string,
  limit: number,
  windowMs: number,
) {
  const now = Date.now();
  const key = `${bucketName}:${getClientIp(request)}`;
  const bucket = rateLimitBuckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  bucket.count += 1;

  if (bucket.count > limit) {
    throw new HttpError(
      429,
      "Muitas tentativas em sequência. Aguarde um pouco e tente novamente.",
    );
  }
}

export async function readJsonBody(request: Request, maxBytes: number) {
  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.toLowerCase().includes("application/json")) {
    throw new HttpError(415, "Envie a requisição como JSON.");
  }

  const declaredLength = Number(request.headers.get("content-length") ?? 0);

  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new HttpError(413, "A requisição é grande demais.");
  }

  if (!request.body) {
    throw new HttpError(400, "JSON inválido.");
  }

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let receivedBytes = 0;
  let body = "";

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    receivedBytes += value.byteLength;

    if (receivedBytes > maxBytes) {
      throw new HttpError(413, "A requisição é grande demais.");
    }

    body += decoder.decode(value, { stream: true });
  }

  body += decoder.decode();

  try {
    return JSON.parse(body) as unknown;
  } catch {
    throw new HttpError(400, "JSON inválido.");
  }
}

export function jsonError(error: unknown) {
  if (error instanceof HttpError) {
    return NextResponse.json({ message: error.message }, { status: error.status });
  }

  return NextResponse.json(
    { message: "Não foi possível concluir a requisição." },
    { status: 500 },
  );
}
