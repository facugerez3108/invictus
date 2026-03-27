import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { updateMatchSchema } from "@/schemas/match.schema";
import { recalculateLeagueStandings } from "@/lib/standings";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, { params }: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await params;

    const match = await prisma.match.findUnique({
      where: { id },
      select: {
        id: true,
        leagueId: true,
        homeTeamId: true,
        awayTeamId: true,
        homeGoals: true,
        awayGoals: true,
        playedAt: true,
        status: true,
      },
    });

    if (!match) {
      return NextResponse.json(
        { message: "Partido no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(match);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return NextResponse.json({ message: "No autenticado" }, { status: 401 });
      }
      if (error.message === "FORBIDDEN") {
        return NextResponse.json({ message: "Sin permisos" }, { status: 403 });
      }
    }

    console.error("GET_MATCH_ERROR", error);
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
    const parsed = updateMatchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Datos inválidos", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existingMatch = await prisma.match.findUnique({
      where: { id },
      select: {
        id: true,
        leagueId: true,
        homeTeamId: true,
        awayTeamId: true,
        status: true,
        playedAt: true,
      },
    });

    if (!existingMatch) {
      return NextResponse.json(
        { message: "Partido no encontrado" },
        { status: 404 }
      );
    }

    const nextLeagueId = parsed.data.leagueId ?? existingMatch.leagueId;
    const nextHomeTeamId = parsed.data.homeTeamId ?? existingMatch.homeTeamId;
    const nextAwayTeamId = parsed.data.awayTeamId ?? existingMatch.awayTeamId;

    const [league, homeTeam, awayTeam] = await Promise.all([
      prisma.league.findUnique({
        where: { id: nextLeagueId },
        select: { id: true },
      }),
      prisma.team.findUnique({
        where: { id: nextHomeTeamId },
        select: { id: true, leagueId: true },
      }),
      prisma.team.findUnique({
        where: { id: nextAwayTeamId },
        select: { id: true, leagueId: true },
      }),
    ]);

    if (!league || !homeTeam || !awayTeam) {
      return NextResponse.json(
        { message: "Liga o equipos inválidos" },
        { status: 400 }
      );
    }

    if (homeTeam.leagueId !== nextLeagueId || awayTeam.leagueId !== nextLeagueId) {
      return NextResponse.json(
        { message: "Los equipos deben pertenecer a la liga seleccionada" },
        { status: 400 }
      );
    }

    const updatedMatch = await prisma.match.update({
      where: { id },
      data: {
        ...(parsed.data.leagueId !== undefined ? { leagueId: parsed.data.leagueId } : {}),
        ...(parsed.data.homeTeamId !== undefined ? { homeTeamId: parsed.data.homeTeamId } : {}),
        ...(parsed.data.awayTeamId !== undefined ? { awayTeamId: parsed.data.awayTeamId } : {}),
        ...(parsed.data.homeGoals !== undefined ? { homeGoals: parsed.data.homeGoals } : {}),
        ...(parsed.data.awayGoals !== undefined ? { awayGoals: parsed.data.awayGoals } : {}),
        ...(parsed.data.playedAt !== undefined
          ? { playedAt: parsed.data.playedAt ? new Date(parsed.data.playedAt) : null }
          : {}),
        ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {}),
      },
      select: {
        id: true,
        leagueId: true,
      },
    });

    const affectedLeagueIds = Array.from(
      new Set([existingMatch.leagueId, updatedMatch.leagueId])
    );

    for (const leagueId of affectedLeagueIds) {
      await recalculateLeagueStandings(leagueId);
    }

    return NextResponse.json(updatedMatch);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return NextResponse.json({ message: "No autenticado" }, { status: 401 });
      }
      if (error.message === "FORBIDDEN") {
        return NextResponse.json({ message: "Sin permisos" }, { status: 403 });
      }
    }

    console.error("UPDATE_MATCH_ERROR", error);
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

    const existingMatch = await prisma.match.findUnique({
      where: { id },
      select: {
        id: true,
        leagueId: true,
      },
    });

    if (!existingMatch) {
      return NextResponse.json(
        { message: "Partido no encontrado" },
        { status: 404 }
      );
    }

    await prisma.match.delete({
      where: { id },
    });

    await recalculateLeagueStandings(existingMatch.leagueId);

    return NextResponse.json({
      message: "Partido eliminado correctamente",
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

    console.error("DELETE_MATCH_ERROR", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}