import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateMatchEventSchema } from "@/schemas/match-event";
import { recalculateMatchScore } from "@/services/match.service";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, { params }: Params) {
  const { id } = await params;

  const event = await prisma.matchEvent.findUnique({
    where: { id },
    include: {
      player: true,
      team: true,
      match: true,
    },
  });

  if (!event) {
    return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });
  }

  return NextResponse.json(event);
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = updateMatchEventSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await prisma.matchEvent.findUnique({
      where: { id },
      select: {
        id: true,
        matchId: true,
        type: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });
    }

    const newMatchId = parsed.data.matchId ?? existing.matchId;
    const newPlayerId = parsed.data.playerId;
    const newTeamId = parsed.data.teamId;

    if (newPlayerId || newTeamId || parsed.data.matchId) {
      const [match, player] = await Promise.all([
        prisma.match.findUnique({
          where: { id: newMatchId },
          select: {
            id: true,
            homeTeamId: true,
            awayTeamId: true,
          },
        }),
        prisma.player.findUnique({
          where: { id: newPlayerId ?? undefined },
          select: {
            id: true,
            teamId: true,
          },
        }),
      ]);

      if (!match) {
        return NextResponse.json({ error: "El partido no existe" }, { status: 404 });
      }

      const finalTeamId = newTeamId;
      if (finalTeamId) {
        const teamIsInMatch =
          finalTeamId === match.homeTeamId || finalTeamId === match.awayTeamId;

        if (!teamIsInMatch) {
          return NextResponse.json(
            { error: "El equipo no participa en este partido" },
            { status: 400 }
          );
        }
      }

      if (player && finalTeamId && player.teamId !== finalTeamId) {
        return NextResponse.json(
          { error: "El jugador no pertenece al equipo enviado" },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.matchEvent.update({
      where: { id },
      data: parsed.data,
    });

    const shouldRecalculate =
      existing.type === "GOAL" || updated.type === "GOAL";

    if (shouldRecalculate) {
      await recalculateMatchScore(existing.matchId);
      if (updated.matchId !== existing.matchId) {
        await recalculateMatchScore(updated.matchId);
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/admin/match-events/[id] error:", error);
    return NextResponse.json(
      { error: "Error interno al actualizar evento" },
      { status: 500 }
    );
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    const { id } = await params;

    const existing = await prisma.matchEvent.findUnique({
      where: { id },
      select: {
        id: true,
        matchId: true,
        type: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });
    }

    await prisma.matchEvent.delete({
      where: { id },
    });

    if (existing.type === "GOAL") {
      await recalculateMatchScore(existing.matchId);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/admin/match-events/[id] error:", error);
    return NextResponse.json(
      { error: "Error interno al eliminar evento" },
      { status: 500 }
    );
  }
}