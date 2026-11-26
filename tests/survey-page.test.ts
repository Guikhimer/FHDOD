import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { notFound } from "next/navigation";
import SurveyPage from "@/app/p/[slug]/page";
import { SurveyForm } from "@/components/SurveyForm";
import { publicApi } from "@/lib/api";

vi.mock("@/lib/api", () => ({ publicApi: vi.fn() }));
vi.mock("@/components/SurveyForm", () => ({ SurveyForm: () => null }));
vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_HTTP_ERROR_FALLBACK;404");
  }),
}));

const rating = {
  id: "30000000-0000-4000-8000-000000000001",
  text: "Como você avalia o atendimento?",
  kind: "rating",
  required: false,
  sectorId: "10000000-0000-4000-8000-000000000001",
};
const props = () => ({
  params: Promise.resolve({ slug: "setor-publicado" }),
  searchParams: Promise.resolve({ tablet: "1" }),
});

describe("published public survey page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.example.com");
  });
  afterEach(() => vi.unstubAllEnvs());

  it.each([{ questions: [rating] }, { questions: [] }])("opens without a configured NPS question (%j)", async ({ questions }) => {
    vi.mocked(publicApi).mockResolvedValueOnce({
      title: "Como foi o seu atendimento?",
      tabletResetSeconds: 20,
      sector: { id: rating.sectorId, name: "Setor publicado" },
      questions,
    });

    const page = await SurveyPage(props());

    expect(page.type).toBe(SurveyForm);
    expect(page.props).toMatchObject({
      demo: false,
      tablet: true,
      survey: { sector_slug: "setor-publicado", sector_name: "Setor publicado" },
    });
    expect(page.props.survey.questions).toHaveLength(questions.length);
    expect(notFound).not.toHaveBeenCalled();
  });

  it("keeps unavailable or unpublished surveys inaccessible", async () => {
    vi.mocked(publicApi).mockRejectedValueOnce(new Error("Survey not found"));

    await expect(SurveyPage(props())).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
    expect(notFound).toHaveBeenCalledOnce();
  });
});
