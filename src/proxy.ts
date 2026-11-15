import { NextResponse, type NextRequest } from "next/server";
import { tokenPairSchema } from "@/lib/api-schemas";
export async function proxy(request: NextRequest) {
  const protectedPath = request.nextUrl.pathname.startsWith("/dashboard");
  const api = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  let access = request.cookies.get("fhdod_access")?.value;
  let refresh = request.cookies.get("fhdod_refresh")?.value;
  const tokenRotation: { value: { accessToken: string; refreshToken: string; expiresIn: number } | null } = { value: null };
  const refreshSession = async () => {
    if (!api || !refresh) return false;
    const result = await fetch(`${api}/api/v1/auth/refresh`, { method: "POST", cache: "no-store", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refreshToken: refresh }) }).catch(() => null);
    if (!result?.ok) return false;
    try {
      const rotated = tokenPairSchema.parse(await result.json());
      tokenRotation.value = rotated; access = rotated.accessToken; refresh = rotated.refreshToken;
      request.cookies.set("fhdod_access", access); request.cookies.set("fhdod_refresh", refresh);
      return true;
    } catch { return false; }
  };
  const checkSession = async () => {
    if (!api || !access) return false;
    const result = await fetch(`${api}/api/v1/auth/me`, { cache: "no-store", headers: { Authorization: `Bearer ${access}` } }).catch(() => null);
    return Boolean(result?.ok);
  };
  if (api && (protectedPath || request.nextUrl.pathname === "/login")) {
    let valid = await checkSession();
    if (!valid && await refreshSession()) valid = await checkSession();
    if (protectedPath && !valid) {
      const target = NextResponse.redirect(new URL("/login", request.url));
      target.cookies.delete("fhdod_access"); target.cookies.delete("fhdod_refresh"); return target;
    }
    if (request.nextUrl.pathname === "/login" && valid) return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  const response = NextResponse.next({ request });
  if (protectedPath) response.headers.set("Cache-Control", "private, no-store");
  if (tokenRotation.value) {
    const options = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/" };
    response.cookies.set("fhdod_access", tokenRotation.value.accessToken, { ...options, maxAge: tokenRotation.value.expiresIn });
    response.cookies.set("fhdod_refresh", tokenRotation.value.refreshToken, { ...options, maxAge: 30 * 24 * 3600 });
  }
  return response;
}
export const config = { matcher: ["/dashboard/:path*", "/login", "/auth/:path*"] };
