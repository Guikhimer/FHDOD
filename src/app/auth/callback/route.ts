import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
export async function GET(request: NextRequest) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
  if (!hasSupabase()) return NextResponse.redirect(new URL("/login", base));
  const code = request.nextUrl.searchParams.get("code");
  const hash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");
  const client = await createClient();
  if (code) {
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL("/dashboard", base));
  } else if (
    hash &&
    (type === "invite" || type === "magiclink" || type === "recovery" || type === "email")
  ) {
    const { error } = await client.auth.verifyOtp({ token_hash: hash, type });
    if (!error)
      return NextResponse.redirect(
        new URL(
          type === "invite" || type === "recovery" ? "/auth/first-access" : "/dashboard",
          base,
        ),
      );
  }
  return NextResponse.redirect(new URL("/login?error=expired", base));
}
