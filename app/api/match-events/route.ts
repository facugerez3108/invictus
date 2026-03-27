import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createMatchEventSchema } from "@/schemas/match-event";
import { recalculateMatchScore } from "@/services/match.service";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const matchId = searchParams.get("matchId");

  const events = await prisma.matchEvent.findMany({
    where: matchId ? { matchId } : undefined,
    include: {
      player: {
        select: {
          id: true,
          name: true,
          number: true,
        },
      },
      team: {
        select: {
          id: true,
          name: true,
        },
      },
      match: {
        select: {
          id: true,
          homeTeamId: true,
          awayTeamId: true,
        },
      },
    },
    orderBy: [{ minute: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json(events);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = createMatchEventSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const [match, player] = await Promise.all([
      prisma.match.findUnique({
        where: { id: data.matchId },
        select: {
          id: true,
          homeTeamId: true,
          awayTeamId: true,
        },
      }),
      prisma.player.findUnique({
        where: { id: data.playerId },
        select: {
          id: true,
          teamId: true,
          isActive: true,
        },
      }),
    ]);

    if (!match) {
      return NextResponse.json({ error: "El partido no existe" }, { status: 404 });
    }

    if (!player) {
      return NextResponse.json({ error: "El jugador no existe" }, { status: 404 });
    }

    if (player.teamId !== data.teamId) {
      return NextResponse.json(
        { error: "El jugador no pertenece al equipo enviado" },
        { status: 400 }
      );
    }

    const teamIsInMatch =
      data.teamId === match.homeTeamId || data.teamId === match.awayTeamId;

    if (!teamIsInMatch) {
      return NextResponse.json(
        { error: "El equipo no participa en este partido" },
        { status: 400 }
      );
    }

    const event = await prisma.$transaction(async (tx) => {
      const created = await tx.matchEvent.create({
        data: {
          matchId: data.matchId,
          playerId: data.playerId,
          teamId: data.teamId,
          type: data.type,
          minute: data.minute,
        },
      });

      return created;
    });

    if (data.type === "GOAL") {
      await recalculateMatchScore(data.matchId);
    }

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/match-events error:", error);
    return NextResponse.json(
      { error: "Error interno al crear evento" },
      { status: 500 }
    );
  }
}