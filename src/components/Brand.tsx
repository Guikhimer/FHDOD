import { HeartPulse } from "lucide-react";
import Link from "next/link";
export function Brand({ dark = false }: { dark?: boolean }) {
  return (
    <Link
      href="/"
      className={`brand ${dark ? "brand-dark" : ""}`}
      aria-label="FHDOD — voltar ao início"
    >
      <span className="brand-mark">
        <HeartPulse size={28} strokeWidth={1.8} aria-hidden="true" />
      </span>
      <span>
        <strong>FHDOD</strong>
        <small>
          Fundação Hospitalar
          <br />
          Dr. Oswaldo Diesel
        </small>
      </span>
    </Link>
  );
}
