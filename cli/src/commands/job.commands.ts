import { Command, OptionValues } from 'commander'
import { trpcClient } from '@/utils/trpc' // index.ts에서 사용하는 trpcClient 경로와 동일하게 설정

// 'job list' 명령어의 액션 핸들러
async function listJobsAction() {
  console.log('작업 목록을 가져오는 중입니다...')
  try {
    const jobs = await trpcClient.job.list.query() // tRPC 호출

    if (!jobs || jobs.length === 0) {
      console.log('생성된 작업이 없습니다.')
      return
    }

    console.log('\n=== 작업 목록 ===')
    jobs.forEach(job => {
      // Job 객체의 타입은 api/src/routers/job.ts의 list 프로시저 반환 타입을 따릅니다.
      // Prisma 모델을 직접 반환했다면, 해당 필드들을 사용합니다.
      let jobInfo = `  ID: ${job.id}, Mesh ID: ${job.meshId}, 상태: ${job.status}`
      if (job.startedAt) {
        jobInfo += `, 시작: ${new Date(job.startedAt).toLocaleString()}`
      }
      if (job.finishedAt) {
        jobInfo += `, 종료: ${new Date(job.finishedAt).toLocaleString()}`
      }
      console.log(jobInfo)
    })
    console.log('=================\n')
  } catch (error: any) {
    console.error('작업 목록을 가져오는 중 오류가 발생했습니다:')
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

// 'job status <job_id>' 명령어의 액션 핸들러
async function getJobStatusAction(
  jobIdStr: string,
  options: OptionValues,
  command: Command
) {
  const jobId = parseInt(jobIdStr, 10)
  if (isNaN(jobId) || jobId <= 0) {
    console.error('오류: 유효한 작업 ID(숫자)를 입력해야 합니다.')
    command.help({ error: true })
    return
  }

  console.log(`작업 ID ${jobId}의 상태를 조회하는 중입니다...`)
  try {
    // API의 getStatus 프로시저가 BigInt를 number로 자동 변환해주는지,
    // 아니면 BigInt로 전달해야 하는지에 따라 trpcClient 호출부의 jobId 타입이 결정됩니다.
    // Prisma는 number를 BigInt로 자동 변환 시도하므로, number로 전달해도 괜찮을 수 있습니다.
    // API의 getJobStatusInputSchema가 z.number()로 정의되어 있으므로 number로 전달합니다.
    const job = await trpcClient.job.getStatus.query({ jobId })

    if (!job) {
      console.log(`작업 ID ${jobId}를 찾을 수 없습니다.`)
      return
    }

    console.log('\n=== 작업 상태 ===')
    console.log(`  ID: ${job.id}`)
    console.log(`  Mesh ID: ${job.meshId}`)
    console.log(`  상태: ${job.status}`)
    console.log(
      `  시작 시간: ${
        job.startedAt
          ? new Date(job.startedAt).toLocaleString()
          : '아직 시작 안 함'
      }`
    )
    console.log(
      `  종료 시간: ${
        job.finishedAt
          ? new Date(job.finishedAt).toLocaleString()
          : '아직 종료 안 함'
      }`
    )
    console.log('=================\n')
  } catch (error: any) {
    console.error(`작업 ID ${jobId} 상태 조회 중 오류가 발생했습니다:`)
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

// 'job submit --mesh <mesh_id>' 명령어의 액션 핸들러
async function submitJobAction(options: { mesh: string }, command: Command) {
  // 옵션으로 --mesh <id>를 받으므로, options.mesh 로 접근합니다.
  const meshId = parseInt(options.mesh, 10)

  if (isNaN(meshId) || meshId <= 0) {
    console.error(
      '오류: 유효한 메쉬 ID(숫자)를 --mesh 옵션으로 전달해야 합니다.'
    )
    command.help({ error: true })
    return
  }

  console.log(`메쉬 ID ${meshId}에 대한 작업을 제출하는 중입니다...`)
  try {
    const newJob = await trpcClient.job.submit.mutate({ meshId })

    console.log('\n=== 작업 제출 완료 ===')
    console.log(`  생성된 작업 ID: ${newJob.id}`)
    console.log(`  상태: ${newJob.status}`)
    console.log(`  Mesh ID: ${newJob.meshId}`)
    console.log('====================\n')
  } catch (error: any) {
    console.error(`메쉬 ID ${meshId} 작업 제출 중 오류가 발생했습니다:`)
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

export function registerJobCommands(program: Command) {
  const jobCmd = program
    .command('job')
    .alias('j')
    .description('시뮬레이션 작업 관련 명령어')

  jobCmd
    .command('list')
    .alias('ls')
    .description('모든 작업의 목록을 보여줍니다.')
    .action(listJobsAction)

  jobCmd
    .command('status <job_id>')
    .alias('s')
    .description('특정 작업 ID의 상태를 조회합니다.')
    .action(getJobStatusAction)

  jobCmd
    .command('submit') // submit 명령어는 인자 대신 옵션을 사용하도록 변경
    .alias('sm')
    .description('새로운 시뮬레이션 작업을 제출합니다.')
    .requiredOption('-m, --mesh <mesh_id>', '작업을 생성할 메쉬 ID') // 필수 옵션으로 변경
    // .option('-p, --param <name=value>', '추가 파라미터 (여러 개 가능)', (value, previous) => previous.concat([value]), []) // 예시: 추가 파라미터 옵션
    .action(submitJobAction) // 옵션 객체가 첫 번째 인자로 전달됨

  // 여기에 다른 job 관련 하위 명령어들 (예: cancel, logs)을 추가할 수 있습니다.
}
