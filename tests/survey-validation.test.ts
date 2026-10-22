import { describe, it, expect } from "vitest";
import { submissionSchema } from "@/lib/survey-validation";
import { filterDates, parseFilters } from "@/lib/filters";
const payload = { submissionId: "00000000-0000-4000-8000-000000000001", nps: 0, answers: [] };
describe("public submission boundary", () => {
  it("accepts NPS zero and no optional answers", () => {
    expect(submissionSchema.safeParse(payload).success).toBe(true);
  });
  it("rejects missing NPS, out-of-range ratings and duplicate questions", () => {
    expect(submissionSchema.safeParse({ ...payload, nps: null }).success).toBe(false);
    expect(
      submissionSchema.safeParse({
        ...payload,
        answers: [{ question_id: payload.submissionId, value: 6 }],
      }).success,
    ).toBe(false);
    expect(
      submissionSchema.safeParse({
        ...payload,
        answers: Array(2).fill({ question_id: payload.submissionId, value: 5 }),
      }).success,
    ).toBe(false);
  });
  it("requires consent only when contact is given, and only opens complaints for low ratings", () => {
    const low = {
      ...payload,
      answers: [{ question_id: payload.submissionId, value: 1 }],
      contact: "(51) 99999-9999",
    };
    expect(submissionSchema.safeParse(low).success).toBe(false);
    expect(submissionSchema.safeParse({ ...low, consent: true }).success).toBe(true);
    expect(submissionSchema.safeParse({ ...payload, comment: "Teste" }).success).toBe(false);
    expect(submissionSchema.safeParse({ ...payload, answers: low.answers }).success).toBe(true);
  });
});
describe("report dates", () => {
  it("includes the full final day in São Paulo", () => {
    expect(filterDates({ from: "2026-10-01", to: "2026-10-02" })).toEqual({
      from: "2026-10-01T00:00:00-03:00",
      to: "2026-10-03T03:00:00.000Z",
    });
  });
  it("rejects impossible dates and reversed ranges", () => {
    expect(() => parseFilters({ from: "2026-02-30" })).toThrow();
    expect(() => parseFilters({ from: "2026-10-03", to: "2026-10-01" })).toThrow();
  });
});
