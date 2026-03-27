import { z } from "zod";

export const createPlayerSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  number: z.number().int().min(1).max(99).optional().nullable(),
  position: z.string().max(50).optional().nullable(),
  isActive: z.boolean().optional(),
  teamId: z.string().uuid("teamId inválido"),
});

export const updatePlayerSchema = createPlayerSchema.partial();