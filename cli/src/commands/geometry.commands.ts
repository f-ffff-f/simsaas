import { Command, OptionValues } from 'commander'
import { trpcClient } from '@/utils/trpc' // 현재 index.ts에서 사용하는 trpcClient 경로와 동일하게 설정

// Action handler for 'geometry create'
async function createGeometryAction(
  options: { project: string; url: string },
  command: Command
) {
  const projectId = parseInt(options.project, 10)
  const { url: fileUrl } = options

  if (isNaN(projectId) || projectId <= 0) {
    console.error(
      '오류: 유효한 프로젝트 ID(숫자)를 --project 옵션으로 전달해야 합니다.'
    )
    command.help({ error: true })
    return
  }
  if (!fileUrl || typeof fileUrl !== 'string' || fileUrl.trim() === '') {
    console.error('오류: 유효한 파일 URL을 --url 옵션으로 전달해야 합니다.')
    command.help({ error: true })
    return
  }

  console.log(
    `프로젝트 ID ${projectId}에 지오메트리(URL: ${fileUrl})를 추가하는 중입니다...`
  )
  try {
    const newGeometry = await trpcClient.geometry.create.mutate({
      projectId,
      fileUrl,
    })
    console.log('\n=== 지오메트리 생성 완료 ===')
    console.log(`  ID: ${newGeometry.id}`)
    console.log(`  Project ID: ${newGeometry.projectId}`)
    console.log(`  File URL: ${newGeometry.fileUrl}`)
    console.log('========================\n')
  } catch (error: any) {
    console.error('지오메트리 생성 중 오류가 발생했습니다:')
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

// Action handler for 'geometry list'
async function listGeometriesAction(
  options: { project: string },
  command: Command
) {
  const projectId = parseInt(options.project, 10)

  if (isNaN(projectId) || projectId <= 0) {
    console.error(
      '오류: 유효한 프로젝트 ID(숫자)를 --project 옵션으로 전달해야 합니다.'
    )
    command.help({ error: true })
    return
  }

  console.log(
    `프로젝트 ID ${projectId}의 지오메트리 목록을 가져오는 중입니다...`
  )
  try {
    const geometries = await trpcClient.geometry.listByProject.query({
      projectId,
    })
    if (geometries.length === 0) {
      console.log(`프로젝트 ID ${projectId}에 해당하는 지오메트리가 없습니다.`)
      return
    }
    console.log(`\n=== 프로젝트 ID ${projectId}의 지오메트리 목록 ===`)
    geometries.forEach(geom => {
      console.log(`  ID: ${geom.id}, File URL: ${geom.fileUrl}`)
    })
    console.log('======================================\n')
  } catch (error: any) {
    console.error('지오메트리 목록 조회 중 오류가 발생했습니다:', error.message)
    process.exit(1)
  }
}

// Action handler for 'geometry view'
async function viewGeometryAction(
  geometryIdStr: string,
  options: OptionValues,
  command: Command
) {
  const geometryId = parseInt(geometryIdStr, 10)
  if (isNaN(geometryId) || geometryId <= 0) {
    console.error('오류: 유효한 지오메트리 ID(숫자)를 입력해야 합니다.')
    command.help({ error: true })
    return
  }
  console.log(`지오메트리 ID ${geometryId} 정보를 가져오는 중입니다...`)
  try {
    const geometry = await trpcClient.geometry.getById.query({ geometryId })
    if (!geometry) {
      console.log(`지오메트리 ID ${geometryId}를 찾을 수 없습니다.`)
      return
    }
    console.log(`\n=== 지오메트리 ID ${geometryId} 상세 정보 ===`)
    console.log(`  ID: ${geometry.id}`)
    console.log(`  Project ID: ${geometry.projectId}`)
    console.log(`  File URL: ${geometry.fileUrl}`)
    // console.log(`  Meshes: ${geometry.meshes?.length || 0} 개`); // API에서 meshes를 include 했다면
    console.log('===================================\n')
  } catch (error: any) {
    console.error('지오메트리 정보 조회 중 오류가 발생했습니다:', error.message)
    process.exit(1)
  }
}

// Action handler for 'geometry delete'
async function deleteGeometryAction(
  geometryIdStr: string,
  options: OptionValues,
  command: Command
) {
  const geometryId = parseInt(geometryIdStr, 10)
  if (isNaN(geometryId) || geometryId <= 0) {
    console.error('오류: 유효한 지오메트리 ID(숫자)를 입력해야 합니다.')
    command.help({ error: true })
    return
  }
  console.log(`지오메트리 ID ${geometryId}를 삭제하는 중입니다...`)
  try {
    const result = await trpcClient.geometry.delete.mutate({ geometryId })
    console.log(`\n=== 지오메트리 삭제 완료 ===`)
    console.log(`  ${result.message} (ID: ${result.id})`)
    console.log('==========================\n')
  } catch (error: any) {
    console.error('지오메트리 삭제 중 오류가 발생했습니다:', error.message)
    process.exit(1)
  }
}

export function registerGeometryCommands(program: Command) {
  const geomCmd = program
    .command('geometry')
    .aliases(['geom', 'g']) // 다양한 별칭 추가
    .description('지오메트리 관련 명령어')

  geomCmd
    .command('create')
    .alias('c')
    .description('새로운 지오메트리를 특정 프로젝트에 추가합니다.')
    .requiredOption(
      '-p, --project <project_id>',
      '지오메트리를 추가할 프로젝트 ID'
    )
    .requiredOption('-u, --url <file_url>', '지오메트리 파일 URL')
    .action(createGeometryAction)

  geomCmd
    .command('list')
    .alias('ls')
    .description('특정 프로젝트에 속한 지오메트리 목록을 보여줍니다.')
    .requiredOption(
      '-p, --project <project_id>',
      '지오메트리 목록을 조회할 프로젝트 ID'
    )
    .action(listGeometriesAction)

  geomCmd
    .command('view <geometry_id>')
    .alias('v')
    .description('특정 ID의 지오메트리 상세 정보를 보여줍니다.')
    .action(viewGeometryAction)

  geomCmd
    .command('delete <geometry_id>')
    .alias('del')
    .description('특정 ID의 지오메트리를 삭제합니다.')
    .action(deleteGeometryAction)
}
