import { requireProfile } from "@/lib/auth";
import { DashboardShell } from "@/components/DashboardShell";
export const dynamic = "force-dynamic";
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();
  return (
    <DashboardShell profile={profile} demo={!process.env.NEXT_PUBLIC_API_URL}>
      {children}
    </DashboardShell>
  );
}
