import { z } from "zod";

export const createPlayerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(80, "El nombre no puede superar los 80 caracteres"),
  number: z.coerce.number().int().min(1).max(99).nullable().optional(),
  position: z.string().trim().max(20).nullable().optional(),
  isActive: z.boolean().optional(),
  teamId: z.string().uuid("Equipo inválido").nullable().optional(),
  currentClubName: z.string().trim().max(100).nullable().optional(),
  currentLeagueName: z.string().trim().max(100).nullable().optional(),
});

export const updatePlayerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(80, "El nombre no puede superar los 80 caracteres")
    .optional(),
  number: z.coerce.number().int().min(1).max(99).nullable().optional(),
  position: z.string().trim().max(20).nullable().optional(),
  isActive: z.boolean().optional(),
  teamId: z.string().uuid("Equipo inválido").nullable().optional(),
  currentClubName: z.string().trim().max(100).nullable().optional(),
  currentLeagueName: z.string().trim().max(100).nullable().optional(),
});