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

    let resolvedPlayerId = "";
    let resolvedPlayer: {
      id: string;
      name: string;
      teamId: string | null;
      isActive: boolean;
    } | null = null;

    if (data.playerMode === "REGISTERED") {
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

      resolvedPlayerId = player.id;
      resolvedPlayer = player;
    } else {
      const normalizedPlayerName = data.playerName.trim();

      const existingPlayer = await prisma.player.findFirst({
        where: {
          name: {
            equals: normalizedPlayerName,
            mode: "insensitive",
          },
        },
        select: {
          id: true,
          name: true,
          teamId: true,
          isActive: true,
        },
      });

      if (existingPlayer) {
        if (!existingPlayer.isActive) {
          return NextResponse.json(
            {
              message:
                "Ya existe un jugador con ese nombre, pero está inactivo. Reactivalo o usá otro nombre.",
            },
            { status: 409 },
          );
        }

        resolvedPlayerId = existingPlayer.id;
        resolvedPlayer = existingPlayer;
      } else {
        const createdPlayer = await prisma.player.create({
          data: {
            name: normalizedPlayerName,
            position: data.position?.trim() || null,
            isActive: true,
            teamId: null,
            currentClubName:
              data.originType === "EXTERNAL"
                ? data.fromExternalName.trim()
                : null,
            currentLeagueName:
              data.originType === "EXTERNAL"
                ? data.fromExternalLeague?.trim() || null
                : null,
          },
          select: {
            id: true,
            name: true,
            teamId: true,
            isActive: true,
          },
        });

        resolvedPlayerId = createdPlayer.id;
        resolvedPlayer = createdPlayer;
      }
    }

    if (!resolvedPlayer) {
      return NextResponse.json(
        { message: "No se pudo resolver el jugador del fichaje" },
        { status: 500 },
      );
    }

    if (data.originType === "INTERNAL") {
      if (data.fromTeamId === data.toTeamId) {
        return NextResponse.json(
          {
            message:
              "El equipo origen no puede ser el mismo que el equipo destino",
          },
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

      if (resolvedPlayer.teamId !== data.fromTeamId) {
        return NextResponse.json(
          {
            message:
              "El jugador no pertenece al equipo origen seleccionado",
          },
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
        playerId: resolvedPlayerId,
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
        playerId: resolvedPlayerId,
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
        type: "PURCHASE",
      },
      select: {
        id: true,
        status: true,
        type: true,
        amount: true,
        createdAt: true,
        player: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(transfer, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "No autenticado" }, { status: 401 });
    }

    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Sin permisos" }, { status: 403 });
    }

    console.error("CREATE_TRANSFER_ERROR", error);

    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 },
    );
  }
}