import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { adminTransferActionSchema } from "@/schemas/admin-transfer.schema";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: Request, { params }: RouteContext) {
  try {
    const session = await requireAdmin();
    const { id } = await params;

    const body = await req.json();
    const parsed = adminTransferActionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Datos inválidos",
          errors: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { action, notes } = parsed.data;

    const transfer = await prisma.transfer.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        amount: true,
        playerId: true,
        fromTeamId: true,
        toTeamId: true,
        fromExternalName: true,
        fromExternalLeague: true,
        player: {
          select: {
            id: true,
            name: true,
            teamId: true,
            currentClubName: true,
            currentLeagueName: true,
            isActive: true,
          },
        },
        toTeam: {
          select: {
            id: true,
            name: true,
            budget: true,
            debtLimit: true,
          },
        },
        fromTeam: {
          select: {
            id: true,
            name: true,
            budget: true,
          },
        },
      },
    });

    if (!transfer) {
      return NextResponse.json(
        { message: "Transferencia no encontrada" },
        { status: 404 },
      );
    }

    if (transfer.status !== "PENDING") {
      return NextResponse.json(
        { message: "La transferencia ya fue procesada" },
        { status: 409 },
      );
    }

    if (action === "REJECT") {
      const rejected = await prisma.transfer.update({
        where: { id: transfer.id },
        data: {
          status: "REJECTED",
          notes: notes?.trim() || null,
          approvedById: session.userId,
          rejectedAt: new Date(),
        },
      });

      return NextResponse.json(rejected);
    }

    if (!transfer.player.isActive) {
      return NextResponse.json(
        { message: "El jugador no está activo" },
        { status: 400 },
      );
    }

    if (transfer.fromTeamId) {
      if (transfer.fromTeamId === transfer.toTeamId) {
        return NextResponse.json(
          { message: "El equipo origen no puede ser el mismo que el destino" },
          { status: 400 },
        );
      }

      if (transfer.player.teamId !== transfer.fromTeamId) {
        return NextResponse.json(
          {
            message:
              "El jugador ya no pertenece al equipo origen indicado en la solicitud",
          },
          { status: 409 },
        );
      }
    }

    const amount = Number(transfer.amount);
    const currentBudget = Number(transfer.toTeam.budget);
    const debtLimit = Number(transfer.toTeam.debtLimit ?? 0);
    const projectedBudget = currentBudget - amount;

    if (projectedBudget < -debtLimit) {
      return NextResponse.json(
        {
          message:
            "La transferencia excede el límite de deuda permitido para el equipo comprador",
        },
        { status: 400 },
      );
    }

    const completed = await prisma.$transaction(async (tx) => {
      await tx.team.update({
        where: { id: transfer.toTeamId },
        data: {
          budget: {
            decrement: amount,
          },
        },
      });

      if (transfer.fromTeamId) {
        await tx.team.update({
          where: { id: transfer.fromTeamId },
          data: {
            budget: {
              increment: amount,
            },
          },
        });
      }

      await tx.player.update({
        where: { id: transfer.playerId },
        data: {
          teamId: transfer.toTeamId,
          currentClubName: transfer.toTeam.name,
          currentLeagueName: null,
        },
      });

      return tx.transfer.update({
        where: { id: transfer.id },
        data: {
          status: "COMPLETED",
          notes: notes?.trim() || null,
          approvedById: session.userId,
          approvedAt: new Date(),
          completedAt: new Date(),
        },
      });
    });

    return NextResponse.json(completed);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "No autenticado" }, { status: 401 });
    }

    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Sin permisos" }, { status: 403 });
    }

    console.error("ADMIN_TRANSFER_ACTION_ERROR", error);

    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 },
    );
  }
}