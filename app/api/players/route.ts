import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPlayerSchema } from "@/schemas/player.schema";
import { requireAdmin } from "@/lib/permissions";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get("teamId");

    const players = await prisma.player.findMany({
      where: teamId ? { teamId } : undefined,
      select: {
        id: true,
        name: true,
        number: true,
        position: true,
        isActive: true,
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
      orderBy: [{ name: "asc" }],
    });

    return NextResponse.json(players);
  } catch (error) {
    console.error("GET /api/players error:", error);
    return NextResponse.json(
      { message: "Error interno al obtener jugadores" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();

    const body = await req.json();
    const parsed = createPlayerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Datos inválidos",
          errors: parsed.error.flatten(),
        },
        { status: 400 },
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

    const player = await prisma.player.create({
      data: {
        name: data.name,
        number: data.number ?? null,
        position: data.position ?? null,
        isActive: data.isActive ?? true,
        teamId: data.teamId ?? null,
        currentClubName: data.currentClubName ?? null,
        currentLeagueName: data.currentLeagueName ?? null,
      },
      select: {
        id: true,
        name: true,
        number: true,
        position: true,
        isActive: true,
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

    return NextResponse.json(player, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return NextResponse.json({ message: "No autenticado" }, { status: 401 });
      }

      if (error.message === "FORBIDDEN") {
        return NextResponse.json({ message: "Sin permisos" }, { status: 403 });
      }
    }

    console.error("POST /api/players error:", error);
    return NextResponse.json(
      { message: "Error interno al crear jugador" },
      { status: 500 },
    );
  }
}