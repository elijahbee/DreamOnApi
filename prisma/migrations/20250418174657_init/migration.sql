-- CreateTable
CREATE TABLE "DreamEntry" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date" TIMESTAMP(3),
    "tags" TEXT,

    CONSTRAINT "DreamEntry_pkey" PRIMARY KEY ("id")
);
