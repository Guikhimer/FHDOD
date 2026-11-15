import { z } from "zod";

export const roleSchema = z.enum(["admin", "ombudsman", "sector_manager"]);
export const tokenPairSchema = z.object({ accessToken: z.string().min(20), refreshToken: z.string().min(20), tokenType: z.literal("Bearer"), expiresIn: z.number().int().positive(), mustChangePassword: z.boolean() });
export const profileSchema = z.object({ id: z.uuid(), full_name: z.string(), role: roleSchema, active: z.boolean(), mustChangePassword: z.boolean() });
export const sectorSchema = z.object({ id: z.uuid(), name: z.string(), slug: z.string(), active: z.boolean() });
export const questionSchema = z.object({ id: z.uuid(), text: z.string(), kind: z.enum(["rating", "nps"]), sector_id: z.uuid().nullable(), position: z.number().int() });
export const metricsSchema = z.object({
  total: z.number().int().nonnegative(), nps: z.number().nullable(), average: z.number().nullable(), satisfaction: z.number().nullable(),
  promoters: z.number().int().nonnegative(), passives: z.number().int().nonnegative(), detractors: z.number().int().nonnegative(), ratings: z.number().int().nonnegative(),
  distribution: z.array(z.object({ value: z.number().int().min(1).max(5), count: z.number().int().nonnegative() })),
  sectors: z.array(z.object({ id: z.uuid(), name: z.string(), total: z.number().int().nonnegative(), nps: z.number().nullable(), average: z.number().nullable() })),
});
export const publicSurveySchema = z.object({
  title: z.string(), tabletResetSeconds: z.number().int(), sector: z.object({ id: z.uuid(), name: z.string() }),
  questions: z.array(z.object({ id: z.uuid(), text: z.string(), kind: z.enum(["rating", "nps"]), required: z.boolean(), sectorId: z.uuid().nullable() })),
});
export const notificationSettingsSchema = z.object({ notification_emails: z.array(z.string().email()), notifications_enabled: z.boolean() });
export const complaintSchema = z.object({ id: z.uuid(), comment: z.string().nullable(), contact: z.string().nullable(), status: z.enum(["open", "in_progress", "closed"]), created_at: z.string() });
export const managedUserSchema = z.object({ id: z.uuid(), email: z.string().email(), full_name: z.string(), role: roleSchema, active: z.boolean(), mustChangePassword: z.boolean(), created_at: z.string() });
