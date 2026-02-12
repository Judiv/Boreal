-- CreateTable
CREATE TABLE "CategoryMapping" (
    "id" SERIAL NOT NULL,
    "category" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CategoryMapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CategoryMapping_category_tag_key" ON "CategoryMapping"("category", "tag");
