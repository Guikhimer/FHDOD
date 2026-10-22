import { z } from "zod";
export const submissionSchema = z
  .object({
    submissionId: z.uuid(),
    nps: z.number().int().min(0).max(10),
    answers: z
      .array(z.object({ question_id: z.uuid(), value: z.number().int().min(1).max(5) }))
      .max(100),
    comment: z.string().trim().max(2000).default(""),
    contact: z
      .string()
      .trim()
      .max(30)
      .refine((s) => !s || /^[+()\d\s-]{8,30}$/.test(s), "Informe um telefone válido.")
      .default(""),
    consent: z.boolean().default(false),
  })
  .superRefine((input, ctx) => {
    if (input.contact && !input.consent)
      ctx.addIssue({
        code: "custom",
        path: ["consent"],
        message: "Autorize o uso do contato para que possamos retornar.",
      });
    if (new Set(input.answers.map((a) => a.question_id)).size !== input.answers.length)
      ctx.addIssue({ code: "custom", path: ["answers"], message: "Pergunta repetida." });
    if (!input.answers.some((a) => a.value < 3) && (input.comment || input.contact))
      ctx.addIssue({
        code: "custom",
        path: ["comment"],
        message: "Comentário disponível para avaliações 1 ou 2.",
      });
  });
export type Submission = z.infer<typeof submissionSchema>;
