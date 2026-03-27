import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPlayerSchema } from "@/schemas/player.schema";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const teamId = searchParams.get("teamId");

  const players = await prisma.player.findMany({
    where: teamId ? { teamId } : undefined,
    include: {
      team: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: [{ team: { name: "asc" } }, { name: "asc" }],
  });

  return NextResponse.json(players);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = createPlayerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const teamExists = await prisma.team.findUnique({
      where: { id: data.teamId },
      select: { id: true },
    });

    if (!teamExists) {
      return NextResponse.json(
        { error: "El equipo no existe" },
        { status: 404 }
      );
    }

    const player = await prisma.player.create({
      data: {
        name: data.name,
        number: data.number ?? null,
        position: data.position ?? null,
        isActive: data.isActive ?? true,
        teamId: data.teamId,
      },
    });

    return NextResponse.json(player, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/players error:", error);
    return NextResponse.json(
      { error: "Error interno al crear jugador" },
      { status: 500 }
    );
  }
}