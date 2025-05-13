/*
  Warnings:

  - Made the column `fileUrl` on table `meshes` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "meshes" ALTER COLUMN "fileUrl" SET NOT NULL,
ALTER COLUMN "fileUrl" SET DEFAULT 'placeholder_mesh_url.msh';
