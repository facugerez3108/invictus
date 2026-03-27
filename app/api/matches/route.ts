import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { createMatchSchema } from "@/schemas/match.schema";
import { recalculateLeagueStandings } from "@/lib/standings";

export async function GET() {
  try {
    await requireAdmin();

    const matches = await prisma.match.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        homeGoals: true,
        awayGoals: true,
        playedAt: true,
        createdAt: true,
        updatedAt: true,
        league: {
          select: { id: true, name: true },
        },
        homeTeam: {
          select: { id: true, name: true },
        },
        awayTeam: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(matches);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return NextResponse.json({ message: "No autenticado" }, { status: 401 });
      }
      if (error.message === "FORBIDDEN") {
        return NextResponse.json({ message: "Sin permisos" }, { status: 403 });
      }
    }

    console.error("GET_MATCHES_ERROR", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();

    const body = await req.json();
    const parsed = createMatchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Datos inválidos", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      leagueId,
      homeTeamId,
      awayTeamId,
      homeGoals,
      awayGoals,
      playedAt,
      status,
    } = parsed.data;

    const [league, homeTeam, awayTeam] = await Promise.all([
      prisma.league.findUnique({
        where: { id: leagueId },
        select: { id: true },
      }),
      prisma.team.findUnique({
        where: { id: homeTeamId },
        select: { id: true, leagueId: true },
      }),
      prisma.team.findUnique({
        where: { id: awayTeamId },
        select: { id: true, leagueId: true },
      }),
    ]);

    if (!league) {
      return NextResponse.json({ message: "La liga no existe" }, { status: 404 });
    }

    if (!homeTeam || !awayTeam) {
      return NextResponse.json(
        { message: "Alguno de los equipos no existe" },
        { status: 404 }
      );
    }

    if (homeTeam.leagueId !== leagueId || awayTeam.leagueId !== leagueId) {
      return NextResponse.json(
        { message: "Los equipos deben pertenecer a la liga seleccionada" },
        { status: 400 }
      );
    }

    const match = await prisma.match.create({
      data: {
        leagueId,
        homeTeamId,
        awayTeamId,
        homeGoals: status === "PLAYED" ? homeGoals ?? 0 : null,
        awayGoals: status === "PLAYED" ? awayGoals ?? 0 : null,
        playedAt: playedAt ? new Date(playedAt) : null,
        status,
      },
      select: {
        id: true,
        status: true,
        homeGoals: true,
        awayGoals: true,
        playedAt: true,
      },
    });

    await recalculateLeagueStandings(leagueId);

    return NextResponse.json(match, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return NextResponse.json({ message: "No autenticado" }, { status: 401 });
      }
      if (error.message === "FORBIDDEN") {
        return NextResponse.json({ message: "Sin permisos" }, { status: 403 });
      }
    }

    console.error("CREATE_MATCH_ERROR", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}