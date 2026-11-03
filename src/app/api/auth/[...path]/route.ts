import { NextResponse } from "next/server";
import { getNeonAuth } from "@/lib/neon/auth-server";

export const dynamic = "force-dynamic";

async function handle(method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE", request: Request, context: { params: Promise<{ path: string[] }> }) {
  const auth = getNeonAuth();
  if (!auth) return NextResponse.json({ message: "Autenticação não configurada." }, { status: 503 });
  return auth.handler()[method](request, context);
}

export const GET = (request: Request, context: { params: Promise<{ path: string[] }> }) => handle("GET", request, context);
export const POST = (request: Request, context: { params: Promise<{ path: string[] }> }) => handle("POST", request, context);
export const PUT = (request: Request, context: { params: Promise<{ path: string[] }> }) => handle("PUT", request, context);
export const PATCH = (request: Request, context: { params: Promise<{ path: string[] }> }) => handle("PATCH", request, context);
export const DELETE = (request: Request, context: { params: Promise<{ path: string[] }> }) => handle("DELETE", request, context);
