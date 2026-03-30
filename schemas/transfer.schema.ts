import { z } from "zod";

const baseTransferSchema = {
  playerId: z.string().uuid("Jugador inválido"),
  toTeamId: z.string().uuid("Equipo destino inválido"),
  amount: z.coerce.number().positive("El monto debe ser mayor a 0"),
};

export const createTransferSchema = z
  .discriminatedUnion("originType", [
    z.object({
      ...baseTransferSchema,
      originType: z.literal("INTERNAL"),
      fromTeamId: z.string().uuid("Equipo origen inválido"),
    }),
    z.object({
      ...baseTransferSchema,
      originType: z.literal("EXTERNAL"),
      fromExternalName: z
        .string()
        .trim()
        .min(2, "El club de origen debe tener al menos 2 caracteres")
        .max(100, "El club de origen no puede superar los 100 caracteres"),
      fromExternalLeague: z
        .string()
        .trim()
        .max(100, "La liga externa no puede superar los 100 caracteres")
        .optional()
        .or(z.literal("")),
    }),
  ])
  .superRefine((data, ctx) => {
    if (data.originType === "INTERNAL" && data.fromTeamId === data.toTeamId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["fromTeamId"],
        message: "El equipo origen no puede ser el mismo que el equipo destino",
      });
    }
  });

export type CreateTransferInput = z.infer<typeof createTransferSchema>;