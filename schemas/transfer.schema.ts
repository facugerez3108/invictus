import { z } from "zod";

const baseTransferSchema = {
  toTeamId: z.string().uuid("Equipo destino inválido"),
  amount: z.coerce.number().positive("El monto debe ser mayor a 0"),
};

const registeredPlayerSchema = z.object({
  playerMode: z.literal("REGISTERED"),
  playerId: z.string().uuid("Jugador inválido"),
});

const manualPlayerSchema = z.object({
  playerMode: z.literal("MANUAL"),
  playerName: z
    .string()
    .trim()
    .min(2, "El nombre del jugador debe tener al menos 2 caracteres")
    .max(100, "El nombre del jugador no puede superar los 100 caracteres"),
  position: z.string().trim().max(20).optional().or(z.literal("")),
});

const internalOriginSchema = z.object({
  originType: z.literal("INTERNAL"),
  fromTeamId: z.string().uuid("Equipo origen inválido"),
});

const externalOriginSchema = z.object({
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
});

export const createTransferSchema = z
  .intersection(
    z.object(baseTransferSchema),
    z.intersection(
      z.discriminatedUnion("playerMode", [
        registeredPlayerSchema,
        manualPlayerSchema,
      ]),
      z.discriminatedUnion("originType", [
        internalOriginSchema,
        externalOriginSchema,
      ]),
    ),
  )
  .superRefine((data, ctx) => {
    if (data.originType === "INTERNAL" && data.fromTeamId === data.toTeamId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["fromTeamId"],
        message: "El equipo origen no puede ser el mismo que el equipo destino",
      });
    }
  });