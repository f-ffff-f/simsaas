import { useState, FormEvent, ChangeEvent, useEffect, useRef } from 'react'
import './App.css'
import { trpcClient } from './utils/trpc'

interface OutputLine {
  id: string
  type: 'command' | 'response' | 'error' | 'system' | 'loading' // 'loading' 타입 추가
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
]

function App() {
  const [input, setInput] = useState<string>('')
  const [output, setOutput] = useState<OutputLine[]>([])
  const outputEndRef = useRef<HTMLDivElement>(null)

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
  }, [])

  useEffect(() => {
    outputEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [output])

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
  }

  // handleSubmit 함수를 async로 변경합니다.
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const commandText = input.trim()

    if (commandText === '') {
      return
    }

    // 사용자가 입력한 명령어를 먼저 출력에 추가
    const commandOutputLine = {
      id: crypto.randomUUID(),
      type: 'command' as const,
      text: `$ ${commandText}`,
    }
    setOutput(prevOutput => [...prevOutput, commandOutputLine])
    setInput('') // 입력창 즉시 비우기

    const [command, ...args] = commandText.toLowerCase().split(' ')
    const subcommand = args[0] // project list에서 'list', project create name에서 'create'
    const commandValue = args.slice(1).join(' ') // project create name에서 'name' 부분

    // 로딩 메시지를 위한 임시 ID
    const loadingId = crypto.randomUUID()

    try {
      switch (command) {
        case 'help':
          setOutput(prevOutput => [
            ...prevOutput,
            {
              id: crypto.randomUUID(),
              type: 'system',
              text: '사용 가능한 명령어:',
            },
            ...suggestedCommands.map(cmd => ({
              id: crypto.randomUUID(),
              type: 'system' as const,
              text: `  ${cmd.name} - ${cmd.description}`,
            })),
          ])
          break
        case 'clear':
          setOutput([])
          return // clear는 여기서 바로 종료
        case 'date':
          setOutput(prevOutput => [
            ...prevOutput,
            {
              id: crypto.randomUUID(),
              type: 'response',
              text: new Date().toLocaleString(),
            },
          ])
          break
        case 'project':
          if (subcommand === 'list') {
            setOutput(prevOutput => [
              ...prevOutput,
              {
                id: loadingId,
                type: 'loading',
                text: '프로젝트 목록을 가져오는 중...',
              },
            ])
            const projects = await trpcClient.project.list.query()
            const projectLines: OutputLine[] =
              projects.length > 0
                ? projects.map(p => ({
                    id: String(p.id),
                    type: 'response' as const,
                    text: `  ID: ${p.id}, 이름: ${p.name}`,
                  }))
                : [
                    {
                      id: crypto.randomUUID(),
                      type: 'response' as const,
                      text: '생성된 프로젝트가 없습니다.',
                    },
                  ]

            setOutput(prevOutput =>
              prevOutput
                .filter(line => line.id !== loadingId)
                .concat(projectLines)
            )
          } else if (subcommand === 'create' && commandValue) {
            setOutput(prevOutput => [
              ...prevOutput,
              {
                id: loadingId,
                type: 'loading',
                text: `'${commandValue}' 프로젝트 생성 중...`,
              },
            ])
            const newProject = await trpcClient.project.create.mutate({
              name: commandValue,
            })
            setOutput(prevOutput =>
              prevOutput
                .filter(line => line.id !== loadingId)
                .concat({
                  id: String(newProject.id),
                  type: 'response' as const,
                  text: `프로젝트 생성됨: ID: ${newProject.id}, 이름: ${newProject.name}`,
                })
            )
          } else {
            setOutput(prevOutput => [
              ...prevOutput,
              {
                id: crypto.randomUUID(),
                type: 'error' as const,
                text: "잘못된 'project' 명령어입니다. 사용법: project list | project create <name>",
              },
            ])
          }
          break
        default:
          setOutput(prevOutput => [
            ...prevOutput,
            {
              id: crypto.randomUUID(),
              type: 'error' as const,
              text: `알 수 없는 명령어: ${commandText}. 'help'를 입력하세요.`,
            },
          ])
      }
    } catch (error: unknown) {
      // tRPC 호출 오류 또는 기타 예외 처리
      const errorMessage =
        error instanceof Error
          ? error.message
          : '알 수 없는 오류가 발생했습니다.'
      setOutput(prevOutput =>
        prevOutput
          .filter(line => line.id !== loadingId)
          .concat({
            id: crypto.randomUUID(),
            type: 'error' as const,
            text: `오류: ${errorMessage}`,
          })
      )
    }
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
