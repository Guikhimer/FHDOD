import Link from "next/link";
import {
  ArrowRight,
  ClipboardCheck,
  LockKeyhole,
  HeartHandshake,
  Sparkles,
  ShieldCheck,
  Tablet,
} from "lucide-react";
import { Brand } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { demoSectors } from "@/lib/demo";
import { publicApi } from "@/lib/api";
import { sectorSchema } from "@/lib/api-schemas";
import type { Sector } from "@/types";

export const dynamic = "force-dynamic";

export default async function Home() {
  const demo = !process.env.NEXT_PUBLIC_API_URL;
  let sectors: Sector[] = demo ? demoSectors : [];
  let loadFailed = false;
  if (!demo) {
    try {
      sectors = await publicApi<Sector[]>("/sectors/public", {}, sectorSchema.array());
      sectors = sectors.filter((sector) => sector.active);
    } catch {
      loadFailed = true;
    }
  }
  return (
    <div className="home-shell">
      <header className="public-header">
        <Brand />
        <Button variant="outline" asChild className="rounded-full font-semibold">
          <Link href="/dashboard">
            <LockKeyhole size={18} aria-hidden="true" /> Área da equipe
          </Link>
        </Button>
      </header>
      <main id="main" className="home-main">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#ffedec] text-[#da2f37] border border-[#ffdad8] mb-4 shadow-sm">
          <Sparkles size={18} />
          <span className="eyebrow m-0 text-xs font-bold tracking-wider">
            FUNDAÇÃO HOSPITALAR DR. OSWALDO DIESEL
          </span>
        </div>

        <h1 className="font-extrabold tracking-tight text-[#191c1e]">
          Cuidar também
          <br />é <span>ouvir você.</span>
        </h1>

        <p className="lead max-w-2xl text-[#424750]">
          Sua experiência nos ajuda a aprimorar o acolhimento e a segurança do hospital.
          <br />
          Escolha o setor em que você foi atendido ou acesse o totem interativo.
        </p>

        {sectors.length > 0 ? (
          <>
            <div className="home-sector-grid">
              {sectors.map((sector, i) => (
                <article key={sector.id} className="sector-card flex flex-col justify-between">
                  <div>
                    <span className="sector-card-icon">
                      {i === 0 ? (
                        <HeartHandshake size={28} aria-hidden="true" />
                      ) : (
                        <ClipboardCheck size={28} aria-hidden="true" />
                      )}
                    </span>
                    <h2>{sector.name}</h2>
                    <p className="text-sm text-[#5c5f61] mb-6">
                      Avaliação rápida anônima com foco na experiência e acolhimento do paciente.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 pt-4 border-t border-[#e0e3e5]">
                    <Link
                      className="font-bold text-sm text-[#da2f37] hover:underline flex items-center justify-between"
                      href={`/p/${encodeURIComponent(sector.slug)}`}
                      aria-label={`Responder pesquisa de ${sector.name}`}
                    >
                      <span>Responder pesquisa</span>
                      <ArrowRight size={18} aria-hidden="true" />
                    </Link>
                    <Link
                      className="font-semibold text-xs text-[#0f3854] hover:text-[#da2f37] flex items-center justify-between"
                      href={`/p/${encodeURIComponent(sector.slug)}?tablet=1`}
                      aria-label={`Abrir pesquisa de ${sector.name} no modo totem`}
                    >
                      <span className="flex items-center gap-1.5">
                        <Tablet size={14} /> Modo Totem (Kiosk Touch)
                      </span>
                      <span>→</span>
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            {demo && (
              <p className="demo-note">
                Ambiente de demonstração · setores e indicadores fictícios.
                <br />
                As avaliações de teste não alteram o histórico oficial.
              </p>
            )}
          </>
        ) : (
          <div className="public-instructions" role={loadFailed ? "alert" : "status"}>
            <ClipboardCheck size={36} aria-hidden="true" className="text-[#da2f37]" />
            <p className="text-[#191c1e] text-base leading-relaxed">
              {loadFailed
                ? "Não foi possível carregar as pesquisas. Atualize a página para tentar novamente ou peça orientação na recepção."
                : "Nenhuma pesquisa está disponível no momento. Peça orientação na recepção."}
            </p>
          </div>
        )}

        <div className="home-reassurance">
          <ShieldCheck size={20} aria-hidden="true" className="text-[#10b981]" />
          <span>
            Avaliação 100% anônima e segura. Nenhum dado pessoal é exigido para responder (LGPD).
          </span>
        </div>
      </main>

      <footer className="public-footer">
        FHDOD · Escutar para cuidar melhor • Hospital Care Ouvidoria & Experiência
      </footer>
    </div>
  );
}
