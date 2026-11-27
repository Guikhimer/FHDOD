import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Home from "@/app/page";
import { publicApi } from "@/lib/api";
import { demoSectors } from "@/lib/demo";

vi.mock("@/lib/api", () => ({ publicApi: vi.fn() }));

describe("public home page", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.example.com");
  });
  afterEach(() => vi.unstubAllEnvs());

  it("lists published surveys for anonymous visitors with regular and tablet links", async () => {
    vi.mocked(publicApi).mockResolvedValueOnce([
      { ...demoSectors[0], name: "Setor publicado", slug: "setor-publicado" },
    ]);

    const html = renderToStaticMarkup(await Home());

    expect(publicApi).toHaveBeenCalledWith("/sectors/public", {}, expect.anything());
    expect(html).toContain("Setor publicado");
    expect(html).toContain('href="/p/setor-publicado"');
    expect(html).toContain('href="/p/setor-publicado?tablet=1"');
    expect(html).toContain("Responder pesquisa");
    expect(html).not.toContain("Ambiente de demonstração");
    expect(html).not.toContain('href="/p/internacao"');
  });

  it("does not link to inactive sectors", async () => {
    vi.mocked(publicApi).mockResolvedValueOnce([{ ...demoSectors[0], active: false }]);

    const html = renderToStaticMarkup(await Home());

    expect(html).not.toContain('href="/p/pronto-atendimento"');
    expect(html).toContain("Nenhuma pesquisa está disponível no momento.");
  });

  it("explains when no surveys are published", async () => {
    vi.mocked(publicApi).mockResolvedValueOnce([]);

    const html = renderToStaticMarkup(await Home());

    expect(html).toContain('role="status"');
    expect(html).toContain("Nenhuma pesquisa está disponível no momento.");
    expect(html).not.toContain("Responder pesquisa");
  });

  it("reports a connection failure without displaying demonstration surveys", async () => {
    vi.mocked(publicApi).mockRejectedValueOnce(new Error("API unavailable"));

    const html = renderToStaticMarkup(await Home());

    expect(html).toContain('role="alert"');
    expect(html).toContain("Não foi possível carregar as pesquisas.");
    expect(html).not.toContain("Nenhuma pesquisa está disponível no momento.");
    expect(html).not.toContain('href="/p/pronto-atendimento"');
  });

  it("preserves demonstration links when no API is configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "");

    const html = renderToStaticMarkup(await Home());

    expect(publicApi).not.toHaveBeenCalled();
    for (const sector of demoSectors) {
      expect(html).toContain(`href="/p/${sector.slug}"`);
      expect(html).toContain(`href="/p/${sector.slug}?tablet=1"`);
    }
    expect(html).toContain("Ambiente de demonstração");
  });
});
