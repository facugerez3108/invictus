import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { createTeamSchema } from "@/schemas/team.schema";
import { slugify } from "@/lib/slugify";

export async function GET() {
  try {
    await requireAdmin();

    const teams = await prisma.team.findMany({
      orderBy: { createdAt: "desc" },
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

    return NextResponse.json(teams);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return NextResponse.json({ message: "No autenticado" }, { status: 401 });
      }
      if (error.message === "FORBIDDEN") {
        return NextResponse.json({ message: "Sin permisos" }, { status: 403 });
      }
    }

    console.error("GET_TEAMS_ERROR", error);
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
    const parsed = createTeamSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Datos inválidos", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      name,
      slug,
      avatarUrl,
      budget,
      isAvailable,
      leagueId,
      ownerId,
    } = parsed.data;

    const finalSlug = slugify(slug?.trim() || name);

    const league = await prisma.league.findUnique({
      where: { id: leagueId },
      select: { id: true },
    });

    if (!league) {
      return NextResponse.json(
        { message: "La liga seleccionada no existe" },
        { status: 404 }
      );
    }

    if (ownerId) {
      const owner = await prisma.user.findUnique({
        where: { id: ownerId },
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
        leagueId,
        name,
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
        leagueId,
        slug: finalSlug,
      },
      select: { id: true },
    });

    if (slugTaken) {
      return NextResponse.json(
        { message: "Ya existe un equipo con ese slug en la liga" },
        { status: 409 }
      );
    }

    const team = await prisma.team.create({
      data: {
        name,
        slug: finalSlug,
        avatarUrl: avatarUrl?.trim() ? avatarUrl.trim() : null,
        budget,
        isAvailable: isAvailable ?? true,
        leagueId,
        ownerId: ownerId ?? null,
        standing: {
          create: {
            leagueId,
          },
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        avatarUrl: true,
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

    return NextResponse.json(team, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return NextResponse.json({ message: "No autenticado" }, { status: 401 });
      }
      if (error.message === "FORBIDDEN") {
        return NextResponse.json({ message: "Sin permisos" }, { status: 403 });
      }
    }

    console.error("CREATE_TEAM_ERROR", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}