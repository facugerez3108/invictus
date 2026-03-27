import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { updateTeamSchema } from "@/schemas/team.schema";
import { slugify } from "@/lib/slugify";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, { params }: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await params;

    const team = await prisma.team.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        budget: true,
        isAvailable: true,
        leagueId: true,
        ownerId: true,
        league: {
          select: {
            id: true,
            name: true,
          },
        },
        owner: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
      },
    });

    if (!team) {
      return NextResponse.json(
        { message: "Equipo no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(team);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return NextResponse.json({ message: "No autenticado" }, { status: 401 });
      }
      if (error.message === "FORBIDDEN") {
        return NextResponse.json({ message: "Sin permisos" }, { status: 403 });
      }
    }

    console.error("GET_TEAM_ERROR", error);
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
    const parsed = updateTeamSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Datos inválidos", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existingTeam = await prisma.team.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        leagueId: true,
      },
    });

    if (!existingTeam) {
      return NextResponse.json(
        { message: "Equipo no encontrado" },
        { status: 404 }
      );
    }

    const nextLeagueId = parsed.data.leagueId ?? existingTeam.leagueId;
    const nextName = parsed.data.name ?? existingTeam.name;
    const nextSlug = slugify(parsed.data.slug?.trim() || parsed.data.name || existingTeam.slug);

    const league = await prisma.league.findUnique({
      where: { id: nextLeagueId },
      select: { id: true },
    });

    if (!league) {
      return NextResponse.json(
        { message: "La liga seleccionada no existe" },
        { status: 404 }
      );
    }

    if (parsed.data.ownerId) {
      const owner = await prisma.user.findUnique({
        where: { id: parsed.data.ownerId },
        select: { id: true },
      });

      if (!owner) {
        return NextResponse.json(
          { message: "El owner seleccionado no existe" },
          { status: 404 }
        );
      }
    }

    const nameTaken = await prisma.team.findFirst({
      where: {
        leagueId: nextLeagueId,
        name: nextName,
        NOT: { id },
      },
      select: { id: true },
    });

    if (nameTaken) {
      return NextResponse.json(
        { message: "Ya existe un equipo con ese nombre en la liga" },
        { status: 409 }
      );
    }

    const slugTaken = await prisma.team.findFirst({
      where: {
        leagueId: nextLeagueId,
        slug: nextSlug,
        NOT: { id },
      },
      select: { id: true },
    });

    if (slugTaken) {
      return NextResponse.json(
        { message: "Ya existe un equipo con ese slug en la liga" },
        { status: 409 }
      );
    }

    const updatedTeam = await prisma.team.update({
      where: { id },
      data: {
        ...(parsed.data.name !== undefined ? { name: nextName } : {}),
        ...(parsed.data.slug !== undefined || parsed.data.name !== undefined
          ? { slug: nextSlug }
          : {}),
        ...(parsed.data.budget !== undefined
          ? { budget: parsed.data.budget }
          : {}),
        ...(parsed.data.isAvailable !== undefined
          ? { isAvailable: parsed.data.isAvailable }
          : {}),
        ...(parsed.data.leagueId !== undefined
          ? { leagueId: parsed.data.leagueId }
          : {}),
        ...(parsed.data.ownerId !== undefined
          ? { ownerId: parsed.data.ownerId ?? null }
          : {}),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        budget: true,
        isAvailable: true,
        createdAt: true,
        updatedAt: true,
        league: {
          select: {
            id: true,
            name: true,
          },
        },
        owner: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
      },
    });

    if (parsed.data.leagueId && parsed.data.leagueId !== existingTeam.leagueId) {
      await prisma.teamStanding.update({
        where: { teamId: id },
        data: {
          leagueId: parsed.data.leagueId,
        },
      });
    }

    return NextResponse.json(updatedTeam);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return NextResponse.json({ message: "No autenticado" }, { status: 401 });
      }
      if (error.message === "FORBIDDEN") {
        return NextResponse.json({ message: "Sin permisos" }, { status: 403 });
      }
    }

    console.error("UPDATE_TEAM_ERROR", error);
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

    const existingTeam = await prisma.team.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingTeam) {
      return NextResponse.json(
        { message: "Equipo no encontrado" },
        { status: 404 }
      );
    }

    const hasMatches = await prisma.match.findFirst({
      where: {
        OR: [{ homeTeamId: id }, { awayTeamId: id }],
      },
      select: { id: true },
    });

    if (hasMatches) {
      return NextResponse.json(
        { message: "No se puede eliminar un equipo que ya tiene partidos asociados" },
        { status: 400 }
      );
    }

    await prisma.team.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Equipo eliminado correctamente",
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

    console.error("DELETE_TEAM_ERROR", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}