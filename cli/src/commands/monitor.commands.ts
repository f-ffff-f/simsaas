import { Command, OptionValues } from 'commander'
import { trpcClient } from '../utils/trpc' // trpcClient 경로 확인 필요
import blessed from 'blessed'
import contrib from 'blessed-contrib'

// 'monitor' 명령어의 액션 핸들러
async function monitorAction(options: OptionValues, command: Command) {
  // 1. Blessed 화면 생성
  const screen = blessed.screen({
    smartCSR: true,
    title: 'SimSaaS Job Monitor',
    fullUnicode: true, // 유니코드 문자 지원
  })

  // 화면 크기 변경 시 레이아웃 재계산
  screen.on('resize', () => {
    screen.render()
  })

  // 2. Grid 레이아웃 생성 (화면을 12x12 그리드로 나눔)
  const grid = new contrib.grid({ rows: 12, cols: 12, screen: screen })

  // 3. Job 목록을 표시할 테이블 위젯 생성
  // grid.set(row, col, rowSpan, colSpan, widgetType, options)
  const jobTable = grid.set(0, 0, 12, 12, contrib.table, {
    keys: true, // 키보드 네비게이션
    vi: true, // vi 스타일 키 바인딩 (j, k 등)
    mouse: true, // 마우스 스크롤
    fg: 'white',
    selectedFg: 'black',
    selectedBg: 'cyan', // 선택된 행 배경색
    interactive: true, // 행 선택 가능
    label: ' Real-time Job List (Press Q or Ctrl+C to quit) ',
    width: '100%',
    height: '100%',
    border: { type: 'line', fg: 'cyan' },
    columnSpacing: 2, // 컬럼 간 간격
    columnWidth: [10, 30, 15, 25], // 각 컬럼 너비 (ID, Name, Status, CreatedAt) - 조정 필요
  })

  // 테이블 포커스 설정 (키보드 네비게이션 활성화)
  jobTable.focus()

  // 4. 주기적으로 Job 목록을 가져와 화면을 업데이트하는 함수
  const fetchAndUpdateJobList = async () => {
    try {
      // getJobList API 호출 (기본 옵션: 최신 20개)
      const jobList = await trpcClient.monitor.getJobList.query({})

      // 테이블 데이터 형식으로 변환: [[col1, col2, ...], ...]
      const tableData = jobList.map(job => {
        if (!job) return null

        const createdAtString = job.createdAt
          ? new Date(job.createdAt).toLocaleString()
          : 'N/A'
        // 테이블 행 데이터 배열 반환
        return [
          job.id.substring(0, 8) + '...', // ID 일부만 표시
          job.name,
          job.state,
          createdAtString,
        ]
      })

      // 테이블 위젯 데이터 업데이트
      jobTable.setData({
        headers: ['ID', 'Name', 'State', 'Created At'],
        data: tableData,
      })

      // 화면 다시 그리기
      screen.render()
    } catch (error: any) {
      // 에러 발생 시 화면에 간단히 표시 (예: 테이블 라벨 변경)
      jobTable.setLabel(
        ` Error fetching data: ${
          error.message || 'Unknown error'
        } (Press Q or Ctrl+C) `
      )
      screen.render()
      // 콘솔에도 에러 로그 출력
      // console.error('Failed to fetch job list:', error.message || error);
    }
  }

  // 5. 초기 데이터 로드
  jobTable.setLabel(' Fetching initial data... (Press Q or Ctrl+C) ')
  screen.render()
  await fetchAndUpdateJobList()

  // 6. 일정 간격(예: 5초)으로 fetchAndUpdateJobList 함수 호출 설정
  const refreshInterval = 1000
  const intervalId = setInterval(fetchAndUpdateJobList, refreshInterval)

  // 7. 종료 키 바인딩 (q 또는 Ctrl+C)
  screen.key(['q', 'C-c'], (ch, key) => {
    clearInterval(intervalId) // 인터벌 정리
    screen.destroy() // Blessed 화면 리소스 정리
    console.log('Exiting monitor.')
    return process.exit(0) // 프로그램 정상 종료
  })
}

// 이 함수를 index.ts에서 호출하여 monitor 명령어를 등록합니다.
export function registerMonitorCommand(program: Command) {
  program
    .command('monitor')
    .alias('m')
    .description('작업 큐 상태를 실시간 목록으로 보여줍니다.')
    .action(monitorAction)
}
