import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { updateUserSchema } from "@/schemas/user.schema";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, { params }: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return NextResponse.json({ message: "No autenticado" }, { status: 401 });
      }

      if (error.message === "FORBIDDEN") {
        return NextResponse.json({ message: "Sin permisos" }, { status: 403 });
      }
    }

    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request, { params }: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await params;

    const body = await req.json();
    const parsed = updateUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Datos inválidos", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { message: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    const { username, password, role } = parsed.data;

    if (username && username !== existingUser.username) {
      const usernameTaken = await prisma.user.findUnique({
        where: { username },
      });

      if (usernameTaken) {
        return NextResponse.json(
          { message: "El username ya está en uso" },
          { status: 409 }
        );
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(username ? { username } : {}),
        ...(password ? { passwordHash: await bcrypt.hash(password, 10) } : {}),
        ...(role ? { role } : {}),
      },
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return NextResponse.json({ message: "No autenticado" }, { status: 401 });
      }

      if (error.message === "FORBIDDEN") {
        return NextResponse.json({ message: "Sin permisos" }, { status: 403 });
      }
    }

    console.error("UPDATE_USER_ERROR", error);

    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(_: Request, { params }: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await params;

    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { message: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Usuario eliminado correctamente",
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return NextResponse.json({ message: "No autenticado" }, { status: 401 });
      }

      if (error.message === "FORBIDDEN") {
        return NextResponse.json({ message: "Sin permisos" }, { status: 403 });
      }
    }

    console.error("DELETE_USER_ERROR", error);

    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}