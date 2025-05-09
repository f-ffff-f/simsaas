import { useState, FormEvent, ChangeEvent, useEffect, useRef } from 'react'
import './App.css'

interface OutputLine {
  id: string
  type: 'command' | 'response' | 'error' | 'system'
  text: string
}

const suggestedCommands = [
  { name: 'help', description: '사용 가능한 명령어를 보여줍니다.' },
  { name: 'clear', description: '화면의 모든 출력을 지웁니다.' },
  { name: 'date', description: '현재 날짜와 시간을 보여줍니다.' },
  { name: 'project list', description: '모든 프로젝트 목록을 보여줍니다.' },
  {
    name: 'project create <name>',
    description:
      '새로운 프로젝트를 생성합니다. (예: project create MySimProject)',
  },
  {
    name: 'project view <id>',
    description:
      '특정 프로젝트의 상세 정보를 보여줍니다. (예: project view 123)',
  },
  {
    name: 'job submit --mesh <mesh_id>',
    description:
      '새로운 시뮬레이션 작업을 제출합니다. (예: job submit --mesh 456)',
  },
  {
    name: 'job status <id>',
    description: '특정 작업의 상태를 확인합니다. (예: job status 789)',
  },
  { name: 'job list', description: '작업 목록을 보여줍니다.' },
  // 여기에 더 많은 관련 명령어를 추가할 수 있습니다.
  // 예: geom list --project <id>, mesh create --geometry <id> 등
]

function App() {
  const [input, setInput] = useState<string>('')
  const [output, setOutput] = useState<OutputLine[]>([])
  const outputEndRef = useRef<HTMLDivElement>(null)

  // 초기 환영 메시지 설정
  useEffect(() => {
    setOutput([
      {
        id: crypto.randomUUID(),
        type: 'system',
        text: 'SimSaaS Web CLI에 오신 것을 환영합니다!',
      },
      {
        id: crypto.randomUUID(),
        type: 'system',
        text: "사용 가능한 명령어를 보려면 'help'를 입력하세요.",
      },
    ])
  }, []) // 마운트 시 한 번만 실행

  useEffect(() => {
    outputEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [output])

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const commandText = input.trim()

    if (commandText === '') {
      return
    }

    const currentOutput = [
      ...output,
      { id: crypto.randomUUID(), type: 'command', text: `$ ${commandText}` },
    ]

    const [command] = commandText.toLowerCase().split(' ') // 명령어 부분만 추출 (인자는 아직 사용 안함)

    switch (command) {
      case 'help':
        currentOutput.push({
          id: crypto.randomUUID(),
          type: 'system',
          text: '사용 가능한 명령어:',
        })
        suggestedCommands.forEach(cmd => {
          currentOutput.push({
            id: crypto.randomUUID(),
            type: 'system',
            text: `  ${cmd.name} - ${cmd.description}`,
          })
        })
        break
      case 'clear':
        setOutput([])
        setInput('')
        return
      case 'date':
        currentOutput.push({
          id: crypto.randomUUID(),
          type: 'response',
          text: new Date().toLocaleString(),
        })
        break
      // project, job 등의 명령어는 아직 실제 액션이 없으므로,
      // 'help'를 통해 목록만 보여주고, 입력 시 '알 수 없는 명령어'로 처리됩니다.
      // tRPC 연동 후 이 부분에 각 명령어에 대한 case를 추가하여 기능을 구현합니다.
      default:
        // 'project' 또는 'job' 같은 키워드가 포함된 경우, 아직 구현되지 않았음을 안내할 수도 있습니다.
        // 여기서는 일단 모든 미구현 명령어를 '알 수 없는 명령어'로 처리합니다.
        currentOutput.push({
          id: crypto.randomUUID(),
          type: 'error',
          text: `알 수 없는 명령어: ${commandText}. 'help'를 입력하여 명령어 목록을 확인하세요.`,
        })
    }

    setOutput(currentOutput as OutputLine[])
    setInput('')
  }

  return (
    <div className="web-cli-container">
      <div className="output-area">
        {output.map(line => (
          <div key={line.id} className={`line ${line.type}`}>
            <span className="line-content">{line.text}</span>
          </div>
        ))}
        <div ref={outputEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="input-area">
        <span className="prompt">$</span>
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          placeholder="명령어를 입력하세요..."
          autoFocus
          spellCheck="false"
        />
      </form>
    </div>
  )
}

export default App
