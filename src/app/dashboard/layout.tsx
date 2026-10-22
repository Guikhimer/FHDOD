import { requireProfile } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { DashboardShell } from "@/components/DashboardShell";
export const dynamic = "force-dynamic";
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();
  return (
    <DashboardShell profile={profile} demo={!hasSupabase()}>
      {children}
    </DashboardShell>
  );
}
