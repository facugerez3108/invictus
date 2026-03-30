import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updatePlayerSchema } from "@/schemas/player.schema";
import { requireAdmin } from "@/lib/permissions";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, { params }: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await params;

    const player = await prisma.player.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        number: true,
        position: true,
        isActive: true,
        teamId: true,
        currentClubName: true,
        currentLeagueName: true,
        createdAt: true,
        updatedAt: true,
        team: {
          select: {
            id: true,
            name: true,
            league: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!player) {
      return NextResponse.json(
        { message: "Jugador no encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json(player);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return NextResponse.json(
          { message: "No autenticado" },
          { status: 401 },
        );
      }

      if (error.message === "FORBIDDEN") {
        return NextResponse.json({ message: "Sin permisos" }, { status: 403 });
      }
    }

    console.error("GET /api/players/[id] error:", error);
    return NextResponse.json(
      { message: "Error interno al obtener jugador" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request, { params }: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await params;

    const body = await req.json();
    const parsed = updatePlayerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Datos inválidos",
          errors: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const existingPlayer = await prisma.player.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingPlayer) {
      return NextResponse.json(
        { message: "Jugador no encontrado" },
        { status: 404 },
      );
    }

    const data = parsed.data;

    if (data.teamId) {
      const teamExists = await prisma.team.findUnique({
        where: { id: data.teamId },
        select: { id: true },
      });

      if (!teamExists) {
        return NextResponse.json(
          { message: "El equipo no existe" },
          { status: 404 },
        );
      }
    }

    const updatedPlayer = await prisma.player.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.number !== undefined ? { number: data.number ?? null } : {}),
        ...(data.position !== undefined
          ? { position: data.position ?? null }
          : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        ...(data.teamId !== undefined ? { teamId: data.teamId ?? null } : {}),
        ...(data.currentClubName !== undefined
          ? { currentClubName: data.currentClubName ?? null }
          : {}),
        ...(data.currentLeagueName !== undefined
          ? { currentLeagueName: data.currentLeagueName ?? null }
          : {}),
      },
      select: {
        id: true,
        name: true,
        number: true,
        position: true,
        isActive: true,
        teamId: true,
        currentClubName: true,
        currentLeagueName: true,
        createdAt: true,
        updatedAt: true,
        team: {
          select: {
            id: true,
            name: true,
            league: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(updatedPlayer);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return NextResponse.json(
          { message: "No autenticado" },
          { status: 401 },
        );
      }

      if (error.message === "FORBIDDEN") {
        return NextResponse.json({ message: "Sin permisos" }, { status: 403 });
      }
    }

    console.error("PATCH /api/players/[id] error:", error);
    return NextResponse.json(
      { message: "Error interno al actualizar jugador" },
      { status: 500 },
    );
  }
}

export async function DELETE(_: Request, { params }: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await params;

    const existingPlayer = await prisma.player.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingPlayer) {
      return NextResponse.json(
        { message: "Jugador no encontrado" },
        { status: 404 },
      );
    }

    await prisma.player.update({
      where: { id },
      data: {
        isActive: false,
      },
    });

    return NextResponse.json({
      message: "Jugador eliminado correctamente",
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return NextResponse.json(
          { message: "No autenticado" },
          { status: 401 },
        );
      }

      if (error.message === "FORBIDDEN") {
        return NextResponse.json({ message: "Sin permisos" }, { status: 403 });
      }
    }

    console.error("DELETE /api/players/[id] error:", error);
    return NextResponse.json(
      { message: "Error interno al eliminar jugador" },
      { status: 500 },
    );
  }
}
