import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasSupabase, publicSupabaseEnv } from "@/lib/env";
export async function proxy(request: NextRequest) {
  if (!hasSupabase()) return NextResponse.next();
  let response = NextResponse.next({ request });
  const { url, key } = publicSupabaseEnv();
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(values) {
        values.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  await supabase.auth.getUser();
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
export const config = { matcher: ["/dashboard/:path*", "/login", "/auth/:path*"] };
