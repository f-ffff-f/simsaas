import { publicProcedure, router } from '@/trpc' // 경로 별칭 사용 중
import {
  createMeshInputSchema,
  listMeshesByGeometryInputSchema,
  getMeshByIdInputSchema,
  deleteMeshInputSchema,
} from '@/schemas/mesh.schema' // 경로 별칭 사용 중

export const meshRouter = router({
  /**
   * 새로운 메쉬를 특정 지오메트리에 대해 생성합니다.
   */
  create: publicProcedure
    .input(createMeshInputSchema)
    .mutation(async ({ input, ctx }) => {
      const { geometryId, resolution } = input

      // geometryId가 실제로 존재하는지 확인 (선택적이지만 권장)
      const geometryExists = await ctx.prisma.geometry.findUnique({
        where: { id: geometryId },
      })
      if (!geometryExists) {
        throw new Error(
          `Geometry with ID ${geometryId} not found. Cannot create mesh.`
        )
      }

      const newMesh = await ctx.prisma.mesh.create({
        data: {
          geometryId: geometryId,
          resolution: resolution,
        },
      })
      return newMesh
    }),

  /**
   * 특정 지오메트리에 속한 메쉬 목록을 조회합니다.
   */
  listByGeometry: publicProcedure
    .input(listMeshesByGeometryInputSchema)
    .query(async ({ input, ctx }) => {
      const { geometryId } = input
      const meshes = await ctx.prisma.mesh.findMany({
        where: {
          geometryId: geometryId,
        },
        // 필요하다면 include로 Geometry 정보나 Job 개수 등을 함께 가져올 수 있습니다.
        // include: { geometry: true, _count: { select: { jobs: true } } }
        orderBy: {
          id: 'asc',
        },
      })
      return meshes
    }),

  /**
   * 특정 ID의 메쉬 정보를 조회합니다.
   */
  getById: publicProcedure
    .input(getMeshByIdInputSchema)
    .query(async ({ input, ctx }) => {
      const { meshId } = input
      const mesh = await ctx.prisma.mesh.findUnique({
        where: { id: meshId },
        // include: { geometry: true, jobs: true } // 필요시 관계 데이터 포함
      })
      if (!mesh) {
        throw new Error(`Mesh with ID ${meshId} not found.`)
      }
      return mesh
    }),

  /**
   * 특정 ID의 메쉬를 삭제합니다.
   */
  delete: publicProcedure
    .input(deleteMeshInputSchema)
    .mutation(async ({ input, ctx }) => {
      const { meshId } = input

      const meshExists = await ctx.prisma.mesh.findUnique({
        where: { id: meshId },
      })
      if (!meshExists) {
        throw new Error(`Mesh with ID ${meshId} not found. Cannot delete.`)
      }

      // onDelete: Cascade 설정으로 인해 연결된 Job 등도 함께 삭제될 수 있습니다.
      await ctx.prisma.mesh.delete({
        where: { id: meshId },
      })
      return {
        success: true,
        id: meshId,
        message: 'Mesh deleted successfully.',
      }
    }),
})
