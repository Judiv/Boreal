-- CreateTable
CREATE TABLE "Boquette" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "lieu" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "isOpen" BOOLEAN NOT NULL DEFAULT false,
    "requiredTag" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Boquette_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Boquette_nom_key" ON "Boquette"("nom");
