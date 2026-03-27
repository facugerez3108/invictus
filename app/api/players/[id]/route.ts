import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updatePlayerSchema } from "@/schemas/player.schema";


type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, { params }: Params) {
  const { id } = await params;

  const player = await prisma.player.findUnique({
    where: { id },
    include: {
      team: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!player) {
    return NextResponse.json({ error: "Jugador no encontrado" }, { status: 404 });
  }

  return NextResponse.json(player);
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = updatePlayerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await prisma.player.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Jugador no encontrado" }, { status: 404 });
    }

    if (parsed.data.teamId) {
      const teamExists = await prisma.team.findUnique({
        where: { id: parsed.data.teamId },
        select: { id: true },
      });

      if (!teamExists) {
        return NextResponse.json(
          { error: "El equipo no existe" },
          { status: 404 }
        );
      }
    }

    const updated = await prisma.player.update({
      where: { id },
      data: {
        ...parsed.data,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/admin/players/[id] error:", error);
    return NextResponse.json(
      { error: "Error interno al actualizar jugador" },
      { status: 500 }
    );
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    const { id } = await params;

    const player = await prisma.player.findUnique({
      where: { id },
      include: {
        events: {
          select: { id: true },
        },
      },
    });

    if (!player) {
      return NextResponse.json({ error: "Jugador no encontrado" }, { status: 404 });
    }

    if (player.events.length > 0) {
      return NextResponse.json(
        {
          error:
            "No se puede eliminar el jugador porque tiene eventos asociados. Podés desactivarlo con isActive.",
        },
        { status: 400 }
      );
    }

    await prisma.player.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/admin/players/[id] error:", error);
    return NextResponse.json(
      { error: "Error interno al eliminar jugador" },
      { status: 500 }
    );
  }
}