import "server-only";
import { createClient } from "@supabase/supabase-js";
import { publicSupabaseEnv } from "@/lib/env";
export function createAdminClient() {
  const { url } = publicSupabaseEnv();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Chave de serviço do Supabase não configurada.");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}
