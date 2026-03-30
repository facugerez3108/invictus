-- CreateEnum
CREATE TYPE "TransferType" AS ENUM ('PURCHASE', 'SALE', 'LOAN', 'FREE_AGENT_SIGNING', 'RELEASE');

-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELED');

-- DropIndex
DROP INDEX "Player_teamId_name_key";

-- AlterTable
ALTER TABLE "Player" ADD COLUMN     "currentClubName" TEXT,
ADD COLUMN     "currentLeagueName" TEXT,
ALTER COLUMN "teamId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "debtLimit" DECIMAL(65,30) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Transfer" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "fromTeamId" TEXT,
    "fromExternalName" TEXT,
    "fromExternalLeague" TEXT,
    "toTeamId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "status" "TransferStatus" NOT NULL,
    "type" "TransferType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transfer_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_fromTeamId_fkey" FOREIGN KEY ("fromTeamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_toTeamId_fkey" FOREIGN KEY ("toTeamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
