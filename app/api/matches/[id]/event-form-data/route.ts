import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, { params }: Params) {
  const { id } = await params;

  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      homeTeam: {
        include: {
          players: {
            where: { isActive: true },
            orderBy: { name: "asc" },
          },
        },
      },
      awayTeam: {
        include: {
          players: {
            where: { isActive: true },
            orderBy: { name: "asc" },
          },
        },
      },
    },
  });

  if (!match) {
    return NextResponse.json({ error: "Partido no encontrado" }, { status: 404 });
  }

  return NextResponse.json(match);
}