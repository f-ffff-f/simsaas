// api/src/plugins/bullmq.ts

import fp from 'fastify-plugin' // Fastify 플러그인을 쉽게 작성하도록 도와주는 유틸리티
import { FastifyInstance } from 'fastify'

import {
  closeBullMQConnections, // 서버 종료 시 BullMQ 관련 연결들을 안전하게 닫는 함수
  simSaaSWorker, // 실제로 작업을 처리하는 Worker 인스턴스
} from '@/lib/queue'

// BullMQ 관련 로직을 Fastify 애플리케이션의 생명주기에 통합하는 플러그인 함수입니다.
async function bullMQPlugin(fastify: FastifyInstance) {
  fastify.log.info('Registering BullMQ plugin...') // 플러그인 등록 시작 로깅

  // --- Worker 준비 상태 확인 ---
  // 'lib/queue.ts' 파일이 임포트될 때 'simSaaSWorker' 인스턴스가 생성되고
  // Redis에 연결을 시도합니다. '.waitUntilReady()'는 Worker가 성공적으로
  // Redis에 연결되어 작업을 처리할 준비가 될 때까지 기다리는 Promise를 반환합니다.
  // 이를 통해 서버가 시작될 때 Worker의 준비 상태를 명확히 로깅할 수 있습니다.
  simSaaSWorker
    .waitUntilReady()
    .then(() => {
      // Worker가 성공적으로 Redis에 연결되었음을 로깅합니다.
      fastify.log.info(
        'BullMQ Worker is connected to Redis and listening for jobs.'
      )
    })
    .catch(err => {
      // Worker가 Redis 연결에 실패한 경우 오류를 로깅합니다.
      // 이 경우, 작업 처리가 불가능하므로 서버 관리자는 문제를 인지하고 조치해야 합니다.
      fastify.log.error({ err }, 'BullMQ Worker failed to connect to Redis.')
    })

  // --- Fastify 서버 종료 시 자원 정리 (Graceful Shutdown) ---
  // 'onClose' 훅은 Fastify 서버가 종료되기 직전에 실행되는 함수를 등록합니다.
  // 여기에 BullMQ 관련 연결(Queue, Worker, Redis 클라이언트 등)을 안전하게
  // 닫는 로직을 추가하여, 예기치 않은 문제나 데이터 유실 없이 깔끔하게
  // 애플리케이션을 종료할 수 있도록 합니다. 이는 매우 중요한 부분입니다.
  fastify.addHook('onClose', async instance => {
    instance.log.info('Closing BullMQ connections due to server shutdown...')
    await closeBullMQConnections() // lib/queue.ts에 정의된 정리 함수 호출
    instance.log.info('BullMQ connections closed.')
  })

  fastify.log.info(
    'BullMQ plugin registered. Worker should be attempting to run.'
  )
}

// 'fastify-plugin'으로 플러그인 함수를 감싸서 Fastify에 등록합니다.
// 'name' 옵션은 플러그인의 이름을 지정하며, Fastify 내부에서 플러그인 중복 등록 방지 등에 사용될 수 있습니다.
export default fp(bullMQPlugin, {
  name: 'bullmq',
})
