-- CreateTable
CREATE TABLE "Project" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "sno" SERIAL NOT NULL,
    "projectName" TEXT NOT NULL,
    "totalFiles" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Project_code_key" ON "Project"("code");

-- Migrate existing project data from File rows
INSERT INTO "Project" ("id", "code", "projectName", "totalFiles", "createdAt", "updatedAt")
SELECT
    gen_random_uuid(),
    grouped."projectId",
    grouped."projectName",
    grouped.file_count,
    grouped.first_created,
    grouped.last_updated
FROM (
    SELECT
        f."projectId",
        f."projectName",
        COUNT(*)::INTEGER AS file_count,
        MIN(f."createdAt") AS first_created,
        MAX(f."updatedAt") AS last_updated
    FROM "File" f
    GROUP BY f."projectId", f."projectName"
) AS grouped;

-- Add temporary FK column
ALTER TABLE "File" ADD COLUMN "projectRefId" UUID;

-- Link files to migrated projects
UPDATE "File" AS f
SET "projectRefId" = p."id"
FROM "Project" AS p
WHERE p."code" = f."projectId";

-- Remove legacy columns and finalize relation
ALTER TABLE "File" DROP COLUMN "projectId";
ALTER TABLE "File" DROP COLUMN "projectName";
ALTER TABLE "File" DROP COLUMN "sno";
ALTER TABLE "File" RENAME COLUMN "projectRefId" TO "projectId";
ALTER TABLE "File" ALTER COLUMN "projectId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "File"
ADD CONSTRAINT "File_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
