import Image from "next/image";
import Link from "next/link";
export function Brand({ dark = false }: { dark?: boolean }) {
  return (
    <Link
      href="/"
      className={`brand ${dark ? "brand-dark" : ""}`}
      aria-label="FHDOD — voltar ao início"
    >
      <span className="brand-art">
        <Image src="/logo-fhdod.png" alt="" width={447} height={447} />
      </span>
    </Link>
  );
}
