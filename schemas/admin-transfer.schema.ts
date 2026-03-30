import { z } from "zod";

export const adminTransferActionSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  notes: z
    .string()
    .trim()
    .max(500, "Las notas no pueden superar los 500 caracteres")
    .optional()
    .or(z.literal("")),
});

export type AdminTransferActionInput = z.infer<typeof adminTransferActionSchema>;