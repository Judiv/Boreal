-- CreateTable
CREATE TABLE "GalleryFolder" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GalleryFolder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "titre" TEXT,
    "description" TEXT,
    "lieu" TEXT,
    "auteur" TEXT,
    "folderId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GalleryFolder_nom_key" ON "GalleryFolder"("nom");

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "GalleryFolder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
