import { registerGeometryCommands } from '@/commands/geometry.commands'
import { registerJobCommands } from '@/commands/job.commands'
import { registerMeshCommands } from '@/commands/mesh.commands'
import { registerMonitorCommand } from '@/commands/monitor.commands'
import { registerProjectCommands } from '@/commands/project.commands'
import { Command } from 'commander'

const program = new Command()

program
  .name('simsaas-cli')
  .description('SimSaaS 프로젝트 관리를 위한 CLI 도구')
  .version('0.1.0')

// 명령어 그룹 등록
registerProjectCommands(program)
registerJobCommands(program)
registerGeometryCommands(program)
registerMeshCommands(program)
registerMonitorCommand(program)

async function main() {
  await program.parseAsync(process.argv)
}

main().catch(error => {
  console.error('CLI 실행 중 예기치 않은 오류 발생:', error)
  process.exit(1)
})
