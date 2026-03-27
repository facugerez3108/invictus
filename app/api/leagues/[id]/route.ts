import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { createLeagueSchema } from "@/schemas/league.schema";
import { slugify } from "@/lib/slugify";

export async function GET() {
  try {
    await requireAdmin();

    const leagues = await prisma.league.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(leagues);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return NextResponse.json({ message: "No autenticado" }, { status: 401 });
      }

      if (error.message === "FORBIDDEN") {
        return NextResponse.json({ message: "Sin permisos" }, { status: 403 });
      }
    }

    console.error("GET_LEAGUES_ERROR", error);

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
    const parsed = createLeagueSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Datos inválidos", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, slug, isActive } = parsed.data;
    const finalSlug = slugify(slug || name);

    const existingLeagueByName = await prisma.league.findUnique({
      where: { name },
    });

    if (existingLeagueByName) {
      return NextResponse.json(
        { message: "Ya existe una liga con ese nombre" },
        { status: 409 }
      );
    }

    const existingLeagueBySlug = await prisma.league.findUnique({
      where: { slug: finalSlug },
    });

    if (existingLeagueBySlug) {
      return NextResponse.json(
        { message: "Ya existe una liga con ese slug" },
        { status: 409 }
      );
    }

    const league = await prisma.league.create({
      data: {
        name,
        slug: finalSlug,
        isActive: isActive ?? true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(league, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return NextResponse.json({ message: "No autenticado" }, { status: 401 });
      }

      if (error.message === "FORBIDDEN") {
        return NextResponse.json({ message: "Sin permisos" }, { status: 403 });
      }
    }

    console.error("CREATE_LEAGUE_ERROR", error);

    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}