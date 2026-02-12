/*
  Warnings:

  - A unique constraint covering the columns `[liseId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `liseId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "liseId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_liseId_key" ON "User"("liseId");
