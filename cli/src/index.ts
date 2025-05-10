// cli/src/index.ts
import { trpcClient } from '@/utils/trpc'
import { Command, OptionValues } from 'commander'

const program = new Command()

program
  .name('simsaas-cli')
  .description('SimSaaS 프로젝트 관리를 위한 CLI 도구')
  .version('0.1.0')

// 'project create' 명령어 정의
program
  .command('project-create <name>') // <name>은 필수 인자
  .alias('pc')
  .description('새로운 프로젝트를 생성합니다. <name>은 필수입니다.')
  .action(async (name: string, options: OptionValues, command: Command) => {
    if (typeof name !== 'string' || name.trim() === '') {
      console.error('오류: 유효한 프로젝트 이름(문자열)을 입력해야 합니다.')
      command.help({ error: true })
      return
    }

    const projectName = name.trim()

    console.log(`'${projectName}' 프로젝트를 생성하는 중입니다...`)
    try {
      const newProject = await trpcClient.project.create.mutate({
        name: projectName,
      })

      console.log('\n=== 프로젝트 생성 완료 ===')
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
  })

// 'project list' 명령어 정의
program
  .command('project-list')
  .alias('pl') // 명령어 별칭
  .description('모든 프로젝트의 목록을 보여줍니다.')
  .action(async () => {
    console.log('프로젝트 목록을 가져오는 중입니다...')
    try {
      const projects = await trpcClient.project.list.query() // tRPC 호출

      if (projects.length === 0) {
        console.log('생성된 프로젝트가 없습니다.')
        return
      }

      console.log('\n=== project list ===')
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
        console.error(error)
      }
      process.exit(1) // 오류 발생 시 비정상 종료
    }
  })

async function main() {
  await program.parseAsync(process.argv)
}

main().catch(error => {
  console.error('CLI 실행 중 예기치 않은 오류 발생:', error)
  process.exit(1)
})
