import { useState, FormEvent, ChangeEvent, useEffect, useRef } from 'react'
import './App.css'

// 출력될 각 라인의 타입을 정의합니다.
interface OutputLine {
  id: string
  type: 'command' | 'response' | 'error' | 'system' // 명령어, 응답, 에러, 시스템 메시지 등
  text: string
}

function App() {
  const [input, setInput] = useState<string>('')
  const [output, setOutput] = useState<OutputLine[]>([])
  const outputEndRef = useRef<HTMLDivElement>(null) // 자동 스크롤을 위한 ref

  // 새 출력이 추가될 때마다 맨 아래로 스크롤합니다.
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

    // 사용자가 입력한 명령어를 출력에 추가
    const newOutput: OutputLine[] = [
      ...output,
      { id: crypto.randomUUID(), type: 'command', text: `$ ${commandText}` },
    ]

    // --- 여기서부터 명령어 파싱 및 실행 로직이 들어갑니다 ---
    // 현재는 임시로 간단한 응답만 추가합니다.
    // TODO: commandText를 파싱하고, tRPC 클라이언트를 호출하여 백엔드와 통신합니다.
    if (commandText.toLowerCase() === 'hello') {
      newOutput.push({
        id: crypto.randomUUID(),
        type: 'response',
        text: 'Hello there! This is your Web CLI.',
      })
    } else if (commandText.toLowerCase() === 'clear') {
      setOutput([]) // 'clear' 명령어 입력 시 출력창 비우기 (새로운 newOutput을 만들지 않음)
      setInput('')
      return // clear는 여기서 종료
    } else if (commandText.toLowerCase() === 'date') {
      newOutput.push({
        id: crypto.randomUUID(),
        type: 'response',
        text: new Date().toLocaleString(),
      })
    } else {
      newOutput.push({
        id: crypto.randomUUID(),
        type: 'error',
        text: `Unknown command: ${commandText}`,
      })
    }
    // --- 명령어 처리 로직 끝 ---

    setOutput(newOutput)
    setInput('') // 입력창 비우기
  }

  return (
    <div className="web-cli-container">
      <div className="output-area">
        {output.map(line => (
          <div key={line.id} className={`line ${line.type}`}>
            <span className="line-content">{line.text}</span>
          </div>
        ))}
        {/* 스크롤 타겟을 위한 빈 div */}
        <div ref={outputEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="input-area">
        <span className="prompt">$</span>
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          placeholder="Enter command..."
          autoFocus
          spellCheck="false" // 터미널같은 느낌을 위해 자동완성/수정 비활성화
        />
      </form>
    </div>
  )
}

export default App
