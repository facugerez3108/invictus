import { z } from "zod";

const matchStatusEnum = z.enum(["SCHEDULED", "PLAYED", "CANCELED"]);

export const createMatchSchema = z
  .object({
    leagueId: z.string().uuid("Liga inválida"),
    homeTeamId: z.string().uuid("Equipo local inválido"),
    awayTeamId: z.string().uuid("Equipo visitante inválido"),
    homeGoals: z.coerce.number().int().min(0).nullable().optional(),
    awayGoals: z.coerce.number().int().min(0).nullable().optional(),
    playedAt: z.string().datetime().nullable().optional(),
    status: matchStatusEnum,
  })
  .superRefine((data, ctx) => {
    if (data.homeTeamId === data.awayTeamId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["awayTeamId"],
        message: "El equipo visitante no puede ser el mismo que el local",
      });
    }

    if (data.status === "PLAYED") {
      if (data.homeGoals == null || data.awayGoals == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["homeGoals"],
          message: "Si el partido fue jugado, los goles son obligatorios",
        });
      }
    }
  });

export const updateMatchSchema = z
  .object({
    leagueId: z.string().uuid("Liga inválida").optional(),
    homeTeamId: z.string().uuid("Equipo local inválido").optional(),
    awayTeamId: z.string().uuid("Equipo visitante inválido").optional(),
    homeGoals: z.coerce.number().int().min(0).nullable().optional(),
    awayGoals: z.coerce.number().int().min(0).nullable().optional(),
    playedAt: z.string().datetime().nullable().optional(),
    status: matchStatusEnum.optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.homeTeamId &&
      data.awayTeamId &&
      data.homeTeamId === data.awayTeamId
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["awayTeamId"],
        message: "El equipo visitante no puede ser el mismo que el local",
      });
    }

    if (data.status === "PLAYED") {
      if (data.homeGoals == null || data.awayGoals == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["homeGoals"],
          message: "Si el partido fue jugado, los goles son obligatorios",
        });
      }
    }
  });

export type CreateMatchInput = z.infer<typeof createMatchSchema>;
export type UpdateMatchInput = z.infer<typeof updateMatchSchema>;