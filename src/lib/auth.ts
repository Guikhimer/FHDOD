import "server-only";
import { redirect } from "next/navigation";
import { apiRequest } from "@/lib/api";
import type { Profile } from "@/types";
import { profileSchema } from "@/lib/api-schemas";
export async function requireProfile(): Promise<Profile> {
  if (!process.env.NEXT_PUBLIC_API_URL) {
    return { id: "demo-profile", full_name: "Equipe FHDOD (demonstração)", role: "admin", active: true, must_change_password: false };
  }
  let data: { id: string; full_name: string; role: Profile["role"]; active: boolean; mustChangePassword: boolean };
  try {
    data = await apiRequest("/auth/me", {}, profileSchema);
  } catch { redirect("/login"); }
  if (data.mustChangePassword) redirect("/auth/first-access");
  return { id: data.id, full_name: data.full_name, role: data.role, active: data.active, must_change_password: data.mustChangePassword };
}
