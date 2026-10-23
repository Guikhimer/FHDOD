"use client";

import { useEffect, useState } from "react";

export function DigitalClock() {
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    function update() {
      const now = new Date();
      setTime(now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
      const d = now.toLocaleDateString("pt-BR", {
        weekday: "short",
        day: "2-digit",
        month: "short",
      });
      setDate(d.charAt(0).toUpperCase() + d.slice(1));
    }
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col text-right">
      <span className="font-mono text-2xl sm:text-3xl font-bold text-sky-400 leading-none tracking-tight">
        {time || "--:--"}
      </span>
      <span className="text-xs text-slate-400 font-medium mt-0.5">{date}</span>
    </div>
  );
}
