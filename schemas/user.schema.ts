import { z } from "zod";

export const createUserSchema = z.object({
    username: z.string().min(3, "El username debe tener almenos 3 caracteres").max(30, "El username debe tener como máximo 30 caracteres"),
    password: z.string().min(6, "La contraseña debe tener almenos 6 caracteres").max(100, "La contraseña es demasiado larga"),
});

export const updateUserSchema = z.object({
    username: z.string().min(3, "El username debe tener almenos 3 caracteres").max(30, "El username debe tener como máximo 30 caracteres").optional(),
    password: z.string().min(6, "La contraseña debe tener almenos 6 caracteres").max(100, "La contraseña es demasiado larga").optional(),
})

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;