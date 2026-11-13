import Image from "next/image";
import Link from "next/link";
export function Brand({ dark = false, tv = false }: { dark?: boolean; tv?: boolean }) {
  const logo = tv ? "/logo-fhdod-tv.png" : dark ? "/logo-equipe-fhdod.png" : "/logo-fhdod.png";
  const dimension = tv ? 1254 : dark ? 1254 : 447;

  return (
    <Link
      href="/"
      className={`brand ${dark || tv ? "brand-dark" : ""} ${tv ? "brand-tv" : ""}`}
      aria-label="FHDOD — voltar ao início"
    >
      <span className="brand-art">
        <Image
          src={logo}
          alt=""
          width={dimension}
          height={dimension}
          unoptimized={dark || tv}
        />
      </span>
    </Link>
  );
}
