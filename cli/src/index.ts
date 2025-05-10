// cli/src/index.ts
console.log('Hello from SimSaaS CLI!')

async function main() {
  // 여기에 Commander.js 및 tRPC 클라이언트 로직이 들어갈 예정입니다.
}

main().catch(error => {
  console.error('CLI 실행 중 오류 발생:', error)
  process.exit(1)
})
