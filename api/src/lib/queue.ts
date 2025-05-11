// api/src/lib/queue.ts
import { Queue, Worker, Job, MetricsTime } from 'bullmq'
import IORedis from 'ioredis'
import prisma from './prisma' // Prisma 클라이언트 임포트
import { JobStatus } from '@prisma/client' // Prisma 생성 타입 임포트
import dotenv from 'dotenv'
import path from 'path'

const QUEUE_NAME = 'simsaas-jobs'

dotenv.config({ path: path.resolve(__dirname, '../../.env') })
// Redis 서버 접속 정보 (환경 변수 등에서 가져옴)
const redisHost = process.env.REDIS_HOST || 'localhost'
const redisPort = Number(process.env.REDIS_PORT) || 6379

// Redis 클라이언트(IORedis)를 생성하기 위한 연결 옵션 객체
const connectionOptions = {
  host: redisHost, // 접속할 Redis 서버의 호스트 주소
  port: redisPort, // 접속할 Redis 서버의 포트 번호
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
}

// IORedis 클라이언트 인스턴스를 생성하는 팩토리 함수
// 이 함수가 호출될 때마다 새로운 IORedis 클라이언트 객체가 생성되고,
// 이 객체는 'connectionOptions'에 지정된 Redis 서버와의 실제 통신을 담당합니다.
const createRedisInstance = () => new IORedis(connectionOptions)

// --- BullMQ의 Queue 객체 생성 ---
// Redis 내 'simsaas-jobs'라는 이름의 큐를 정의/관리하며, 앱 레벨에서 이 큐와 상호작용할 인터페이스를 제공합니다.
export const simSaaSJobQueue = new Queue(
  // 1. 큐의 고유 이름: QUEUE_NAME
  // BullMQ는 이 이름을 사용하여 Redis 내에서 이 큐와 관련된 모든 데이터
  // (작업 목록, 상태 등)를 구분하고 관리합니다.
  // Redis 키의 접두사 등으로 활용되어 다른 큐와 격리됩니다.
  QUEUE_NAME,
  {
    // 2. Redis 연결 설정:
    // 'connection' 옵션을 통해 BullMQ Queue 객체가 어떤 Redis 서버와 통신할지를 지정합니다.
    // 여기서는 'createRedisInstance()' 함수를 호출하여 생성된 IORedis 클라이언트 인스턴스를
    // 연결 객체로 사용합니다.
    // 이 IORedis 인스턴스가 QUEUE_NAME 큐와 관련된 모든 Redis 명령을
    // 'connectionOptions'에 명시된 Redis 서버로 전송하고 응답을 받습니다.
    connection: createRedisInstance(),

    // 이 큐에 추가되는 작업들에 대한 기본 옵션들입니다.
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: {
        count: 1000,
        age: 60 * 60 * 24 * 7,
      },
      removeOnFail: {
        count: 5000,
        age: 60 * 60 * 24 * 14,
      },
    },
  }
)

// 작업 데이터 타입 정의
interface ProcessMeshJobData {
  dbJobId: string // Prisma의 Job ID (BigInt를 string으로 변환하여 전달)
  meshId: number
}

// --- BullMQ의 Worker 객체 생성 ---
// 이 객체는 지정된 큐(QUEUE_NAME)를 주시하며, 해당 큐에 작업이 들어오면
// 정의된 작업 처리 함수(processor function)를 실행하여 작업을 수행합니다.
// 즉, 생산자-소비자 패턴에서 '소비자(Consumer)'의 역할을 담당합니다.
export const simSaaSWorker = new Worker<ProcessMeshJobData>(
  // 1. 주시할 큐의 이름: QUEUE_NAME
  // 'simSaaSJobQueue' 객체가 작업을 추가하는 Redis 내의 바로 그 큐와 동일한 이름을 지정합니다.
  // 이를 통해 Worker는 해당 큐에 들어오는 작업들을 가져와 처리할 수 있습니다.
  QUEUE_NAME,

  // 2. 작업 처리 함수 (Processor Function):
  // 이 비동기 함수는 QUEUE_NAME 큐에서 작업을 가져올 때마다 BullMQ에 의해 호출됩니다.
  // 'job' 매개변수에는 BullMQ가 전달하는 작업 객체가 담겨 있으며,
  // 이 객체를 통해 작업 데이터(job.data), 작업 ID(job.id), 작업 이름(job.name) 등에 접근할 수 있습니다.
  async (job: Job<ProcessMeshJobData>) => {
    // 작업 데이터에서 필요한 값들을 추출합니다.
    // dbJobIdString은 Prisma의 BigInt ID를 문자열로 받은 것이므로 다시 BigInt로 변환합니다.
    const { dbJobId: dbJobIdString, meshId } = job.data
    const dbJobId = BigInt(dbJobIdString)

    console.log(
      `[Worker] Processing job ${job.id} (DB Job ID: ${dbJobId}) for mesh ${meshId}. Type: ${job.name}`
    )

    // 작업 처리 중 발생할 수 있는 예외를 잡고 적절히 처리하기 위해 try...catch 블록을 사용합니다.
    try {
      // 단계 1: 데이터베이스에서 현재 작업의 상태를 'RUNNING'(실행 중)으로 업데이트합니다.
      // 작업 시작 시간도 기록합니다.
      await prisma.job.update({
        where: { id: dbJobId },
        data: {
          status: JobStatus.RUNNING,
          startedAt: new Date(),
        },
      })

      // 단계 2: 실제 작업 수행 로직 (여기서는 5초간 대기하는 모의 작업).
      // 이 부분에 실제 메쉬 생성, 시뮬레이션 실행 등의 복잡한 비동기 코드가 위치하게 됩니다.
      console.log(`[Worker] Simulating work for job ${dbJobId}...`)
      await new Promise(resolve => setTimeout(resolve, 5000)) // 5초간 모의 작업
      const mockFileUrl = `mock/results/job_${dbJobId}_mesh_${meshId}.dat`
      const mockMetrics = {
        processingTimeMs: 5000,
        nodes: Math.floor(Math.random() * 1000) + 500,
        elements: Math.floor(Math.random() * 5000) + 2000,
      }
      console.log(`[Worker] Work simulation completed for job ${dbJobId}.`)

      // 단계 3: 작업 성공 처리.
      // Prisma 트랜잭션을 사용하여 여러 DB 변경 작업을 원자적으로 실행합니다.
      // (결과 레코드 생성과 작업 상태 업데이트가 모두 성공하거나 모두 실패하도록 보장)
      await prisma.$transaction(async tx => {
        // 3-1. 작업 결과(Result) 레코드를 데이터베이스에 생성합니다.
        await tx.result.create({
          data: {
            jobId: dbJobId,
            fileUrl: mockFileUrl,
            metrics: mockMetrics,
          },
        })
        // 3-2. 작업 상태를 'SUCCESS'(성공)로 업데이트하고 완료 시간을 기록합니다.
        await tx.job.update({
          where: { id: dbJobId },
          data: {
            status: JobStatus.SUCCESS,
            finishedAt: new Date(),
          },
        })
      })

      console.log(
        `[Worker] Job ${dbJobId} completed successfully. Result created.`
      )
      // 작업 처리 함수는 작업의 결과물을 반환할 수 있습니다. 이 값은 'completed' 이벤트 리스너 등에서 사용될 수 있습니다.
      return { success: true, fileUrl: mockFileUrl, metrics: mockMetrics }
    } catch (error) {
      // 단계 4: 작업 실패 처리.
      console.error(
        `[Worker] Job ${job.id} (DB Job ID: ${dbJobId}) failed:`,
        error
      )
      // 데이터베이스에서 작업 상태를 'FAILED'(실패)로 업데이트하고 완료 시간(여기서는 실패 시간)을 기록합니다.
      await prisma.job.update({
        where: { id: dbJobId },
        data: {
          status: JobStatus.FAILED,
          finishedAt: new Date(),
        },
      })
      // 오류를 다시 throw하여 BullMQ에게 이 작업이 실패했음을 알립니다.
      // BullMQ는 이 정보를 바탕으로 설정된 재시도 로직(Queue의 defaultJobOptions 등)을 따릅니다.
      throw error
    }
  },
  {
    // 3. Redis 연결 설정:
    // Queue 객체와 마찬가지로 Worker 객체도 Redis와 통신해야 합니다.
    // 'createRedisInstance()'를 통해 생성된 IORedis 클라이언트 인스턴스를 사용하여
    // Redis 서버에 연결하고 작업 정보를 가져오거나 상태를 업데이트합니다.
    connection: createRedisInstance(),

    // 아래는 워커의 동시 작업 처리 수 및 성능 관련 옵션들입니다.
    concurrency: 5,
    limiter: {
      max: 10,
      duration: 1000,
    },
    metrics: {
      maxDataPoints: MetricsTime.ONE_HOUR * 24,
    },
  }
)

// Worker 이벤트 리스너 (로깅 및 모니터링에 유용)
simSaaSWorker.on('completed', (job: Job<ProcessMeshJobData>, result) => {
  console.log(
    `[Worker Event] Job ${job.id} (DB Job ID: ${job.data.dbJobId}) has completed.`
  )
})

simSaaSWorker.on('failed', (job, err) => {
  // job이 undefined일 수 있으므로 job?.id, job?.data.dbJobId로 안전하게 접근
  console.error(
    `[Worker Event] Job ${job?.id} (DB Job ID: ${job?.data.dbJobId}) has failed with error: ${err.message}`
  )
})

simSaaSWorker.on('progress', (job: Job<ProcessMeshJobData>, progress) => {
  // job.updateProgress(data)를 통해 Worker 내부에서 진행 상황을 보고하면 이 이벤트가 발생합니다.
  console.log(
    `[Worker Event] Job ${job.id} (DB Job ID: ${job.data.dbJobId}) progress: ${progress}%`
  )
})

simSaaSWorker.on('error', err => {
  // Non-job related errors
  console.error('[Worker Event] Worker encountered an error:', err)
})

// 애플리케이션 종료 시 BullMQ 관련 리소스 정리
export async function closeBullMQConnections(): Promise<void> {
  console.log('Closing BullMQ worker and queue...')
  await simSaaSWorker.close()
}
