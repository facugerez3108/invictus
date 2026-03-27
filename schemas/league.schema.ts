import { z } from "zod";

export const createLeagueSchema = z.object({
  name: z
    .string()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(80, "El nombre no puede superar los 80 caracteres"),
  slug: z
    .string()
    .trim()
    .transform((value) => (value === "" ? undefined : value))
    .optional()
    .refine(
      (value) => value === undefined || /^[a-z0-9-]+$/.test(value),
      "El slug solo puede contener minúsculas, números y guiones",
    ),
  isActive: z.boolean().optional(),
});

export const updateLeagueSchema = z.object({
  name: z
    .string()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(80, "El nombre no puede superar los 80 caracteres")
    .optional(),
  slug: z
    .string()
    .min(3, "El slug debe tener al menos 3 caracteres")
    .max(100, "El slug no puede superar los 100 caracteres")
    .regex(
      /^[a-z0-9-]+$/,
      "El slug solo puede contener minúsculas, números y guiones",
    )
    .optional(),
  isActive: z.boolean().optional(),
});

export type CreateLeagueInput = z.infer<typeof createLeagueSchema>;
export type UpdateLeagueInput = z.infer<typeof updateLeagueSchema>;
