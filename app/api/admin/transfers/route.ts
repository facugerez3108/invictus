import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";

export async function GET() {
  try {
    await requireAdmin();

    const transfers = await prisma.transfer.findMany({
      where: {
        status: "PENDING",
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        amount: true,
        status: true,
        type: true,
        createdAt: true,
        fromExternalName: true,
        fromExternalLeague: true,
        player: {
          select: {
            id: true,
            name: true,
            position: true,
            teamId: true,
            team: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        fromTeam: {
          select: {
            id: true,
            name: true,
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
        requestedBy: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    const serialized = transfers.map((transfer) => {
      const amount = Number(transfer.amount);
      const currentBudget = Number(transfer.toTeam.budget);
      const debtLimit = Number(transfer.toTeam.debtLimit ?? 0);
      const projectedBudget = currentBudget - amount;
      const exceedsDebt = projectedBudget < -debtLimit;

      return {
        ...transfer,
        amount,
        toTeam: {
          ...transfer.toTeam,
          budget: currentBudget,
          debtLimit,
          projectedBudget,
          exceedsDebt,
        },
      };
    });

    return NextResponse.json(serialized);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "No autenticado" }, { status: 401 });
    }

    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Sin permisos" }, { status: 403 });
    }

    console.error("ADMIN_GET_TRANSFERS_ERROR", error);

    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 },
    );
  }
}