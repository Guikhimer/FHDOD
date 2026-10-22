"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
export function RealtimeRefresh({ demo }: { demo: boolean }) {
  const router = useRouter();
  const [status, setStatus] = useState("Conectando atualização ao vivo…");
  useEffect(() => {
    if (demo) return;
    const client = createClient();
    let debounce: ReturnType<typeof setTimeout>;
    const channel = client
      .channel("tv-metrics")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "responses" }, () => {
        clearTimeout(debounce);
        debounce = setTimeout(() => router.refresh(), 1000);
      })
      .subscribe((state) => {
        setStatus(
          state === "SUBSCRIBED"
            ? "Atualização ao vivo conectada"
            : "Reconectando · atualização a cada minuto",
        );
      });
    const polling = setInterval(() => router.refresh(), 60000);
    return () => {
      clearInterval(polling);
      clearTimeout(debounce);
      void client.removeChannel(channel);
    };
  }, [demo, router]);
  return (
    <span className="realtime-status">
      <span className="status-dot" />
      {demo ? "Demonstração · dados fictícios" : status}
    </span>
  );
}
