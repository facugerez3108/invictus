import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/schemas/auth.schema";
import { setSessionCookie, signToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid request data", errors: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { username, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { username } });

    if (!user) {
      return NextResponse.json(
        {
          message: "Invalid username or password",
        },
        { status: 401 },
      );
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      return NextResponse.json(
        {
          message: "Invalid username or password",
        },
        { status: 401 },
      );
    }

    const token = await signToken({ 
        userId: user.id,
        username: user.username,
        role: user.role, 
    });

    await setSessionCookie(token);

    return NextResponse.json({
        message: "Login successful",
        user: {
            id: user.id,
            username: user.username,
            role: user.role,
        }
    });
  } catch (error) {
    console.error("LOGIN_ERROR", error);
    return NextResponse.json(
      { error: "An error occurred during login" },
      { status: 500 },
    );
  }
}
