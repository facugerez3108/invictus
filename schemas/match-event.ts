import { z } from "zod";

export const matchEventTypeEnum = z.enum(["GOAL", "YELLOW_CARD", "RED_CARD"]);

export const createMatchEventSchema = z.object({
  matchId: z.string().uuid("matchId inválido"),
  playerId: z.string().uuid("playerId inválido"),
  teamId: z.string().uuid("teamId inválido"),
  type: matchEventTypeEnum,
  minute: z.number().int().min(0).max(130),
});

export const updateMatchEventSchema = createMatchEventSchema.partial();