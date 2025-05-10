import { Command, OptionValues } from 'commander'
import { trpcClient } from '@/utils/trpc'

// Action handler for 'mesh create'
async function createMeshAction(
  options: { geometry: string; resolution: string },
  command: Command
) {
  const geometryId = parseInt(options.geometry, 10)
  const resolution = parseInt(options.resolution, 10)

  if (isNaN(geometryId) || geometryId <= 0) {
    console.error(
      '오류: 유효한 지오메트리 ID(숫자)를 --geometry 옵션으로 전달해야 합니다.'
    )
    command.help({ error: true })
    return
  }
  if (isNaN(resolution) || resolution <= 0) {
    // 예시: 해상도는 0보다 커야 함 (API 스키마에 따라 조정)
    console.error(
      '오류: 유효한 해상도 값(숫자)을 --resolution 옵션으로 전달해야 합니다.'
    )
    command.help({ error: true })
    return
  }

  console.log(
    `지오메트리 ID ${geometryId}에 해상도 ${resolution}으로 메쉬를 생성하는 중입니다...`
  )
  try {
    const newMesh = await trpcClient.mesh.create.mutate({
      geometryId,
      resolution,
    })
    console.log('\n=== 메쉬 생성 완료 ===')
    console.log(`  ID: ${newMesh.id}`)
    console.log(`  Geometry ID: ${newMesh.geometryId}`)
    console.log(`  Resolution: ${newMesh.resolution}`)
    console.log('====================\n')
  } catch (error: any) {
    console.error('메쉬 생성 중 오류가 발생했습니다:')
    if (error.data?.zodError?.fieldErrors) {
      console.error(
        '입력값 오류:',
        JSON.stringify(error.data.zodError.fieldErrors, null, 2)
      )
    } else if (error.message) {
      console.error(error.message)
    } else {
      console.error(JSON.stringify(error, null, 2))
    }
    process.exit(1)
  }
}

// Action handler for 'mesh list'
async function listMeshesAction(
  options: { geometry: string },
  command: Command
) {
  const geometryId = parseInt(options.geometry, 10)

  if (isNaN(geometryId) || geometryId <= 0) {
    console.error(
      '오류: 유효한 지오메트리 ID(숫자)를 --geometry 옵션으로 전달해야 합니다.'
    )
    command.help({ error: true })
    return
  }

  console.log(`지오메트리 ID ${geometryId}의 메쉬 목록을 가져오는 중입니다...`)
  try {
    const meshes = await trpcClient.mesh.listByGeometry.query({ geometryId })
    if (meshes.length === 0) {
      console.log(`지오메트리 ID ${geometryId}에 해당하는 메쉬가 없습니다.`)
      return
    }
    console.log(`\n=== 지오메트리 ID ${geometryId}의 메쉬 목록 ===`)
    meshes.forEach(mesh => {
      console.log(`  ID: ${mesh.id}, Resolution: ${mesh.resolution}`)
    })
    console.log('====================================\n')
  } catch (error: any) {
    console.error('메쉬 목록 조회 중 오류가 발생했습니다:', error.message)
    process.exit(1)
  }
}

// Action handler for 'mesh view'
async function viewMeshAction(
  meshIdStr: string,
  options: OptionValues,
  command: Command
) {
  const meshId = parseInt(meshIdStr, 10)
  if (isNaN(meshId) || meshId <= 0) {
    console.error('오류: 유효한 메쉬 ID(숫자)를 입력해야 합니다.')
    command.help({ error: true })
    return
  }
  console.log(`메쉬 ID ${meshId} 정보를 가져오는 중입니다...`)
  try {
    const mesh = await trpcClient.mesh.getById.query({ meshId })
    if (!mesh) {
      console.log(`메쉬 ID ${meshId}를 찾을 수 없습니다.`)
      return
    }
    console.log(`\n=== 메쉬 ID ${meshId} 상세 정보 ===`)
    console.log(`  ID: ${mesh.id}`)
    console.log(`  Geometry ID: ${mesh.geometryId}`)
    console.log(`  Resolution: ${mesh.resolution}`)
    // console.log(`  Jobs: ${mesh.jobs?.length || 0} 개`); // API에서 jobs를 include 했다면
    console.log('===============================\n')
  } catch (error: any) {
    console.error('메쉬 정보 조회 중 오류가 발생했습니다:', error.message)
    process.exit(1)
  }
}

// Action handler for 'mesh delete'
async function deleteMeshAction(
  meshIdStr: string,
  options: OptionValues,
  command: Command
) {
  const meshId = parseInt(meshIdStr, 10)
  if (isNaN(meshId) || meshId <= 0) {
    console.error('오류: 유효한 메쉬 ID(숫자)를 입력해야 합니다.')
    command.help({ error: true })
    return
  }
  console.log(`메쉬 ID ${meshId}를 삭제하는 중입니다...`)
  try {
    const result = await trpcClient.mesh.delete.mutate({ meshId })
    console.log(`\n=== 메쉬 삭제 완료 ===`)
    console.log(`  ${result.message} (ID: ${result.id})`)
    console.log('======================\n')
  } catch (error: any) {
    console.error('메쉬 삭제 중 오류가 발생했습니다:', error.message)
    process.exit(1)
  }
}

export function registerMeshCommands(program: Command) {
  const meshCmd = program
    .command('mesh')
    .alias('msh') // 다른 별칭 사용 가능
    .description('메쉬 관련 명령어')

  meshCmd
    .command('create')
    .alias('c')
    .description('새로운 메쉬를 특정 지오메트리에 대해 생성합니다.')
    .requiredOption(
      '-g, --geometry <geometry_id>',
      '메쉬를 생성할 지오메트리 ID'
    )
    .requiredOption(
      '-r, --resolution <level>',
      '메쉬 해상도 레벨 (예: 1, 5, 10)'
    )
    .action(createMeshAction)

  meshCmd
    .command('list')
    .alias('ls')
    .description('특정 지오메트리에 속한 메쉬 목록을 보여줍니다.')
    .requiredOption(
      '-g, --geometry <geometry_id>',
      '메쉬 목록을 조회할 지오메트리 ID'
    )
    .action(listMeshesAction)

  meshCmd
    .command('view <mesh_id>')
    .alias('v')
    .description('특정 ID의 메쉬 상세 정보를 보여줍니다.')
    .action(viewMeshAction)

  meshCmd
    .command('delete <mesh_id>')
    .alias('del')
    .description('특정 ID의 메쉬를 삭제합니다.')
    .action(deleteMeshAction)
}
