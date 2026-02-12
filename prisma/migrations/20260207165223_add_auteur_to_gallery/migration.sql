/*
  Warnings:

  - Added the required column `auteur` to the `GalleryFolder` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "GalleryFolder" ADD COLUMN     "auteur" TEXT NOT NULL;
