import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";
import { createTransferSchema } from "@/schemas/transfer.schema";

export async function POST(req: Request) {
  try {
    const session = await requireAuth();

    const body = await req.json();
    const parsed = createTransferSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Datos inválidos",
          errors: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const data = parsed.data;

    const destinationTeam = await prisma.team.findUnique({
      where: { id: data.toTeamId },
      select: {
        id: true,
        ownerId: true,
        budget: true,
        debtLimit: true,
        name: true,
      },
    });

    if (!destinationTeam) {
      return NextResponse.json(
        { message: "Equipo destino no encontrado" },
        { status: 404 },
      );
    }

    if (destinationTeam.ownerId !== session.userId) {
      return NextResponse.json(
        { message: "No tenés permisos para solicitar fichajes para este equipo" },
        { status: 403 },
      );
    }

    const player = await prisma.player.findUnique({
      where: { id: data.playerId },
      select: {
        id: true,
        name: true,
        teamId: true,
        isActive: true,
      },
    });

    if (!player) {
      return NextResponse.json(
        { message: "Jugador no encontrado" },
        { status: 404 },
      );
    }

    if (!player.isActive) {
      return NextResponse.json(
        { message: "El jugador no está activo" },
        { status: 400 },
      );
    }

    if (data.originType === "INTERNAL") {
      if (data.fromTeamId === data.toTeamId) {
        return NextResponse.json(
          { message: "El equipo origen no puede ser el mismo que el equipo destino" },
          { status: 400 },
        );
      }

      const fromTeam = await prisma.team.findUnique({
        where: { id: data.fromTeamId },
        select: { id: true, name: true },
      });

      if (!fromTeam) {
        return NextResponse.json(
          { message: "Equipo origen no encontrado" },
          { status: 404 },
        );
      }

      if (player.teamId !== data.fromTeamId) {
        return NextResponse.json(
          { message: "El jugador no pertenece al equipo origen seleccionado" },
          { status: 400 },
        );
      }
    }

    const currentBudget = Number(destinationTeam.budget);
    const debtLimit = Number(destinationTeam.debtLimit ?? 0);
    const projectedBudget = currentBudget - data.amount;

    if (projectedBudget < -debtLimit) {
      return NextResponse.json(
        {
          message: "El fichaje excede el límite de deuda permitido para tu equipo",
        },
        { status: 400 },
      );
    }

    const existingPending = await prisma.transfer.findFirst({
      where: {
        playerId: data.playerId,
        status: "PENDING",
      },
      select: { id: true },
    });

    if (existingPending) {
      return NextResponse.json(
        { message: "Ya existe una solicitud pendiente para este jugador" },
        { status: 409 },
      );
    }

    const transfer = await prisma.transfer.create({
      data: {
        playerId: data.playerId,
        fromTeamId: data.originType === "INTERNAL" ? data.fromTeamId : null,
        fromExternalName:
          data.originType === "EXTERNAL" ? data.fromExternalName.trim() : null,
        fromExternalLeague:
          data.originType === "EXTERNAL"
            ? data.fromExternalLeague?.trim() || null
            : null,
        toTeamId: data.toTeamId,
        requestedById: session.userId,
        amount: data.amount,
        status: "PENDING",
        type: data.originType === "EXTERNAL" ? "PURCHASE" : "PURCHASE",
      },
    });

    return NextResponse.json(transfer, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "No autenticado" }, { status: 401 });
    }

    console.error("CREATE_TRANSFER_ERROR", error);

    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 },
    );
  }
}