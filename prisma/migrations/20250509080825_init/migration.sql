-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'RUNNING', 'FAILED', 'SUCCESS');

-- CreateTable
CREATE TABLE "Project" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Geometry" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "fileUrl" TEXT NOT NULL,

    CONSTRAINT "Geometry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mesh" (
    "id" SERIAL NOT NULL,
    "geometryId" INTEGER NOT NULL,
    "resolution" INTEGER NOT NULL,

    CONSTRAINT "Mesh_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" BIGSERIAL NOT NULL,
    "meshId" INTEGER NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Result" (
    "id" SERIAL NOT NULL,
    "jobId" BIGINT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "metrics" JSONB NOT NULL,

    CONSTRAINT "Result_pkey" PRIMARY KEY ("id")
);
