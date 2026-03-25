import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(3, "Username inválido"),
  password: z.string().min(6, "Contraseña inválida"),
});

export type LoginInput = z.infer<typeof loginSchema>;