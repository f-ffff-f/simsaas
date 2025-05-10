import { trpcClient } from '@/utils/trpc'
import { Command, OptionValues } from 'commander'

// 'project list' 명령어의 액션 핸들러
async function listProjectsAction() {
  console.log('프로젝트 목록을 가져오는 중입니다...')
  try {
    const projects = await trpcClient.project.list.query()

    if (projects.length === 0) {
      console.log('생성된 프로젝트가 없습니다.')
      return
    }

    console.log('\n=== 프로젝트 목록 ===')
    projects.forEach(project => {
      console.log(project)
    })
    console.log('====================\n')
  } catch (error: any) {
    console.error('프로젝트 목록을 가져오는 중 오류가 발생했습니다:')
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

// 'project create <name>' 명령어의 액션 핸들러
async function createProjectAction(
  name: string,
  options: OptionValues,
  command: Command
) {
  if (typeof name !== 'string' || name.trim() === '') {
    console.error('오류: 유효한 프로젝트 이름(문자열)을 입력해야 합니다.')
    command.help({ error: true }) // 현재 subcommand의 도움말 표시
    return
  }

  const projectName = name.trim()

  console.log(`'${projectName}' 프로젝트를 생성하는 중입니다...`)
  try {
    const newProject = await trpcClient.project.create.mutate({
      name: projectName,
    })

    console.log('\n=== 프로젝트 생성 완료 ===')
    // 이전 로그에서는 newProject 객체 전체를 출력했습니다. 필요에 따라 포맷팅합니다.
    console.log(newProject)
    console.log('========================\n')
  } catch (error: any) {
    console.error(`'${projectName}' 프로젝트 생성 중 오류가 발생했습니다:`)
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

// 이 함수를 index.ts에서 호출하여 project 관련 명령어들을 등록합니다.
export function registerProjectCommands(program: Command) {
  // 'project' 라는 상위 명령어를 만듭니다.
  const projectCmd = program
    .command('project')
    .alias('p') // 'p'라는 별칭 사용 가능 (예: simsaas-cli p list)
    .description('프로젝트 관련 명령어')

  // 'project' 명령어의 하위 명령어로 'create'를 추가합니다.
  projectCmd
    .command('create <name>')
    .alias('c') // 'c'라는 별칭 사용 가능 (예: simsaas-cli p c "새 프로젝트")
    .description('새로운 프로젝트를 생성합니다. <name>은 필수입니다.')
    .action(createProjectAction)

  // 'project' 명령어의 하위 명령어로 'list'를 추가합니다.
  projectCmd
    .command('list')
    .alias('ls') // 'ls'라는 별칭 사용 가능 (예: simsaas-cli p ls)
    .description('모든 프로젝트의 목록을 보여줍니다.')
    .action(listProjectsAction)

  // 여기에 다른 project 관련 하위 명령어들 (예: view, delete)을 추가할 수 있습니다.
}
