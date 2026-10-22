import "server-only";
import { redirect } from "next/navigation";
import { hasSupabase } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types";
export async function requireProfile(): Promise<Profile> {
  if (!hasSupabase())
    return {
      id: "demo",
      full_name: "Equipe FHDOD",
      role: "admin",
      active: true,
      must_change_password: false,
    };
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");
  const { data: profile } = await supabase
    .from("profiles")
    .select("id,full_name,role,active,must_change_password")
    .eq("id", user.id)
    .single();
  if (!profile?.active) redirect("/login?error=inactive");
  if (profile.must_change_password) redirect("/auth/first-access");
  return profile as Profile;
}
