import "server-only";
import { cookies } from "next/headers";

const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

export type ApiError = { error?: { code?: string; message?: string; requestId?: string } };

export async function apiRequest<T>(path: string, init: RequestInit = {}, authenticated = true): Promise<T> {
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
  return (await response.json()) as T;
}

export async function publicApi<T>(path: string, init?: RequestInit): Promise<T> {
  return apiRequest<T>(path, init, false);
}
