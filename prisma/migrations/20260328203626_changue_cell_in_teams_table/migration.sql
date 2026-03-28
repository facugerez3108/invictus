/*
  Warnings:

  - You are about to drop the column `avatarUrl` on the `Match` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Match" DROP COLUMN "avatarUrl";

-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "avatarUrl" TEXT;
