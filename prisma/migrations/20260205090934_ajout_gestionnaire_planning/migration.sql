/*
  Warnings:

  - You are about to drop the column `auteur` on the `ForumPost` table. All the data in the column will be lost.
  - Added the required column `auteurId` to the `ForumPost` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gestionnaireId` to the `PlanningEvent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ForumPost" DROP COLUMN "auteur",
ADD COLUMN     "auteurId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "PlanningEvent" ADD COLUMN     "gestionnaireId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "password" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "PlanningEvent" ADD CONSTRAINT "PlanningEvent_gestionnaireId_fkey" FOREIGN KEY ("gestionnaireId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumPost" ADD CONSTRAINT "ForumPost_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
