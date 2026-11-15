import "server-only";
import { cookies } from "next/headers";
import { z } from "zod";

const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

export type ApiError = { error?: { code?: string; message?: string; requestId?: string } };

async function request<T>(path: string, init: RequestInit, authenticated: boolean, schema?: z.ZodType<T>): Promise<T> {
  if (!baseUrl) throw new Error("API não configurada.");
  const jar = await cookies();
  const accessToken = jar.get("fhdod_access")?.value;
  const response = await fetch(`${baseUrl}/api/v1${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(authenticated && accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...init.headers,
    },
  });
  if (!response.ok) throw new Error("Não foi possível concluir a solicitação.");
  if (response.status === 204) return undefined as T;
  const payload: unknown = await response.json();
  return schema ? schema.parse(payload) : payload as T;
}

export async function apiRequest<T>(path: string, init: RequestInit = {}, schema?: z.ZodType<T>): Promise<T> {
  return request(path, init, true, schema);
}

export async function publicApi<T>(path: string, init?: RequestInit, schema?: z.ZodType<T>): Promise<T> {
  return request(path, init ?? {}, false, schema);
}
