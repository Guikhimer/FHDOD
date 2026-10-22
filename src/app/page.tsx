import Link from "next/link";
import { ArrowRight, ClipboardCheck, LockKeyhole, HeartHandshake } from "lucide-react";
import { Brand } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { hasSupabase } from "@/lib/env";
import { demoSectors } from "@/lib/demo";
export default function Home() {
  const demo = !hasSupabase();
  return (
    <div className="home-shell">
      <header className="public-header">
        <Brand />
        <Button variant="outline" asChild>
          <Link href="/dashboard">
            <LockKeyhole size={20} aria-hidden="true" /> Área da equipe
          </Link>
        </Button>
      </header>
      <main id="main" className="home-main">
        <div className="eyebrow">FUNDAÇÃO HOSPITALAR DR. OSWALDO DIESEL</div>
        <h1>
          Cuidar também
          <br />é <span>ouvir você.</span>
        </h1>
        <p className="lead">
          Sua experiência nos ajuda a melhorar.
          <br />
          Escolha o setor em que você foi atendido.
        </p>
        {demo ? (
          <>
            <div className="home-sector-grid">
              {demoSectors.map((sector, i) => (
                <Link className="sector-card" key={sector.id} href={`/p/${sector.slug}`}>
                  <span className="sector-card-icon">
                    {i === 0 ? (
                      <HeartHandshake aria-hidden="true" />
                    ) : (
                      <ClipboardCheck aria-hidden="true" />
                    )}
                  </span>
                  <h2>{sector.name}</h2>
                  <span>
                    Avaliar atendimento <ArrowRight size={20} aria-hidden="true" />
                  </span>
                </Link>
              ))}
            </div>
            <p className="demo-note">
              Ambiente de demonstração · setores e indicadores fictícios.
              <br />
              As avaliações não são armazenadas.
            </p>
          </>
        ) : (
          <div className="public-instructions">
            <ClipboardCheck size={36} aria-hidden="true" />
            <p>
              Para avaliar, abra o link ou leia o QR Code disponível no setor em que você foi
              atendido.
            </p>
          </div>
        )}
        <div className="home-reassurance">
          <LockKeyhole size={20} aria-hidden="true" /> Você não precisa informar seu nome para
          avaliar.
        </div>
      </main>
      <footer className="public-footer">FHDOD · Escutar para cuidar melhor.</footer>
    </div>
  );
}
