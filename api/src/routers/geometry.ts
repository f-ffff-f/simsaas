import { z } from 'zod'
import { publicProcedure, router } from '@/trpc' // 경로 별칭 사용 중
import {
  createGeometryInputSchema,
  listGeometriesByProjectInputSchema,
  getGeometryByIdInputSchema,
  deleteGeometryInputSchema,
} from '@/schemas/geometry.schema' // 경로 별칭 사용 중

export const geometryRouter = router({
  /**
   * 새로운 지오메트리를 특정 프로젝트에 추가합니다.
   */
  create: publicProcedure
    .input(createGeometryInputSchema)
    .mutation(async ({ input, ctx }) => {
      const { projectId, fileUrl } = input

      // projectId가 실제로 존재하는지 확인
      const projectExists = await ctx.prisma.project.findUnique({
        where: { id: projectId },
      })
      if (!projectExists) {
        throw new Error(`Project with ID ${projectId} not found.`)
      }

      const newGeometry = await ctx.prisma.geometry.create({
        data: {
          projectId: projectId,
          fileUrl: fileUrl,
        },
      })
      return newGeometry
    }),

  /**
   * 특정 프로젝트에 속한 지오메트리 목록을 조회합니다.
   */
  listByProject: publicProcedure
    .input(listGeometriesByProjectInputSchema)
    .query(async ({ input, ctx }) => {
      const { projectId } = input
      const geometries = await ctx.prisma.geometry.findMany({
        where: {
          projectId: projectId,
        },
        // 필요하다면 include로 Project 정보나 Mesh 개수 등을 함께 가져올 수 있습니다.
        // include: { project: true, _count: { select: { meshes: true } } }
        orderBy: {
          id: 'asc',
        },
      })
      return geometries
    }),

  /**
   * 특정 ID의 지오메트리 정보를 조회합니다.
   */
  getById: publicProcedure
    .input(getGeometryByIdInputSchema)
    .query(async ({ input, ctx }) => {
      const { geometryId } = input
      const geometry = await ctx.prisma.geometry.findUnique({
        where: { id: geometryId },
        // include: { project: true, meshes: true } // 필요시 관계 데이터 포함
      })
      if (!geometry) {
        throw new Error(`Geometry with ID ${geometryId} not found.`)
      }
      return geometry
    }),

  /**
   * 특정 ID의 지오메트리를 삭제합니다.
   */
  delete: publicProcedure
    .input(deleteGeometryInputSchema)
    .mutation(async ({ input, ctx }) => {
      const { geometryId } = input

      // 삭제 전 해당 지오메트리가 존재하는지 확인 (선택적)
      const geometryExists = await ctx.prisma.geometry.findUnique({
        where: { id: geometryId },
      })
      if (!geometryExists) {
        throw new Error(
          `Geometry with ID ${geometryId} not found. Cannot delete.`
        )
      }

      // onDelete: Cascade 설정으로 인해 연결된 Mesh 등도 함께 삭제될 수 있습니다.
      await ctx.prisma.geometry.delete({
        where: { id: geometryId },
      })
      return {
        success: true,
        id: geometryId,
        message: 'Geometry deleted successfully.',
      }
    }),
})
