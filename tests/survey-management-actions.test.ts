import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { revalidatePath } from "next/cache";
import { deleteSurvey } from "@/app/dashboard/manage/actions";
import { apiRequest } from "@/lib/api";
import { requireProfile } from "@/lib/auth";
import type { Profile } from "@/types";

vi.mock("@/lib/api", () => ({ apiRequest: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requireProfile: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const surveyId = "20000000-0000-4000-8000-000000000001";
function form(id = surveyId, confirmed = "yes") {
  const data = new FormData();
  data.set("id", id);
  data.set("confirmed", confirmed);
  return data;
}
function profile(role: Profile["role"]): Profile {
  return { id: "admin", full_name: "Equipe", role, active: true, must_change_password: false };
}

describe("delete survey action", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.example.com");
    vi.mocked(requireProfile).mockResolvedValue(profile("admin"));
  });
  afterEach(() => vi.unstubAllEnvs());

  it.each(["admin", "ombudsman"] as const)("allows %s and refreshes the public and management pages", async (role) => {
    vi.mocked(requireProfile).mockResolvedValue(profile(role));
    vi.mocked(apiRequest).mockResolvedValueOnce(undefined);

    expect(await deleteSurvey({}, form())).toEqual({ success: "Pesquisa excluída. As avaliações recebidas foram preservadas." });
    expect(apiRequest).toHaveBeenCalledExactlyOnceWith(`/surveys/${surveyId}`, { method: "DELETE" });
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard/manage");
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith("/p/[slug]", "page");
  });

  it("blocks sector managers before calling the API", async () => {
    vi.mocked(requireProfile).mockResolvedValue(profile("sector_manager"));
    expect(await deleteSurvey({}, form())).toHaveProperty("error");
    expect(apiRequest).not.toHaveBeenCalled();
  });

  it.each([["invalid", "yes"], [surveyId, ""], [surveyId, "no"]])("requires a valid id and explicit confirmation (%s, %s)", async (id, confirmation) => {
    expect(await deleteSurvey({}, form(id, confirmation))).toHaveProperty("error");
    expect(apiRequest).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("does not call a backend in demonstration mode", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "");
    expect(await deleteSurvey({}, form())).toHaveProperty("error");
    expect(apiRequest).not.toHaveBeenCalled();
  });

  it("preserves the displayed list when the API fails", async () => {
    vi.mocked(apiRequest).mockRejectedValueOnce(new Error("Unavailable"));
    expect(await deleteSurvey({}, form())).toHaveProperty("error");
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
