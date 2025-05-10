// cli/src/index.ts
import { trpcClient } from '@/utils/trpc'
import { Command } from 'commander'
import dotenv from 'dotenv'

// .env 파일 로드 (API_URL 등 환경변수 사용 위함)
dotenv.config()

const program = new Command()

program
  .name('simsaas-cli')
  .description('SimSaaS 프로젝트 관리를 위한 CLI 도구')
  .version('0.1.0') // cli/package.json의 버전과 일치시키는 것이 좋습니다.

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
      // tRPC 에러 객체 구조에 따라 좀 더 상세한 오류 메시지 파싱 가능
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

// 여기에 'project create <name>' 등 다른 명령어들을 추가할 수 있습니다.

async function main() {
  await program.parseAsync(process.argv)
}

main().catch(error => {
  console.error('CLI 실행 중 예기치 않은 오류 발생:', error)
  process.exit(1)
})
