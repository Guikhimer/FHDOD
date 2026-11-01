"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
export function RealtimeRefresh({ demo }: { demo: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (demo) return;
    const polling = setInterval(() => router.refresh(), 30000);
    return () => clearInterval(polling);
  }, [demo, router]);
  return (
    <span className="realtime-status">
      <span className="status-dot" />
      {demo ? "Demonstração · dados fictícios" : "Atualização automática a cada 30 segundos"}
    </span>
  );
}
