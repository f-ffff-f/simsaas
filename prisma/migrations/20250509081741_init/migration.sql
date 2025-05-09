/*
  Warnings:

  - You are about to drop the `Geometry` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Job` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Mesh` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Project` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Result` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Geometry";

-- DropTable
DROP TABLE "Job";

-- DropTable
DROP TABLE "Mesh";

-- DropTable
DROP TABLE "Project";

-- DropTable
DROP TABLE "Result";

-- CreateTable
CREATE TABLE "projects" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "geometries" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "fileUrl" TEXT NOT NULL,

    CONSTRAINT "geometries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meshes" (
    "id" SERIAL NOT NULL,
    "geometryId" INTEGER NOT NULL,
    "resolution" INTEGER NOT NULL,

    CONSTRAINT "meshes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" BIGSERIAL NOT NULL,
    "meshId" INTEGER NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "results" (
    "id" SERIAL NOT NULL,
    "jobId" BIGINT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "metrics" JSONB NOT NULL,

    CONSTRAINT "results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "results_jobId_key" ON "results"("jobId");

-- AddForeignKey
ALTER TABLE "geometries" ADD CONSTRAINT "geometries_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meshes" ADD CONSTRAINT "meshes_geometryId_fkey" FOREIGN KEY ("geometryId") REFERENCES "geometries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_meshId_fkey" FOREIGN KEY ("meshId") REFERENCES "meshes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "results" ADD CONSTRAINT "results_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
