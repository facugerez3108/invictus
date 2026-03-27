import { z } from "zod";

export const createTeamSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(80, "El nombre no puede superar los 80 caracteres"),
  slug: z
    .string()
    .trim()
    .optional(),
  budget: z.coerce
    .number()
    .min(0, "El presupuesto no puede ser negativo"),
  isAvailable: z.boolean().optional(),
  leagueId: z.string().uuid("Liga inválida"),
  ownerId: z.string().uuid("Owner inválido").nullable().optional(),
});

export const updateTeamSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(80, "El nombre no puede superar los 80 caracteres")
    .optional(),
  slug: z
    .string()
    .trim()
    .optional(),
  budget: z.coerce
    .number()
    .min(0, "El presupuesto no puede ser negativo")
    .optional(),
  isAvailable: z.boolean().optional(),
  leagueId: z.string().uuid("Liga inválida").optional(),
  ownerId: z.string().uuid("Owner inválido").nullable().optional(),
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;