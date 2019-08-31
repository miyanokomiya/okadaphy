import * as React from 'react'
import { render } from 'react-dom'
import Canvas from './Canvas'

const App: React.FC = () => {
  const [draftText, setDraftText] = React.useState('岡田')
  const [text, setText] = React.useState(draftText)
  const onInputText = React.useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDraftText(e.target.value)
  }, [])

  return (
    <div>
      <Canvas width={window.innerWidth * 0.8} height={innerHeight / 2} text={text} />
      <div>
        <textarea cols={30} rows={3} value={draftText} onChange={onInputText} />
        <button onClick={() => setText(draftText)}>Run</button>
      </div>
    </div>
  )
}

render(<App />, document.getElementById('root') as any)
