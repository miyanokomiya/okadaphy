import * as React from 'react'
import { render } from 'react-dom'
import Canvas from './Canvas'
import ConfigForm from './ConfigForm'
import { IOptions } from '../types'

const App: React.FC = () => {
  const [count, refresh] = React.useState(0)
  const [text, setText] = React.useState('岡田を\n切る技術')
  const [fillStyle, setFillStyle] = React.useState('#000')
  const [strokeStyle, setStrokeStyle] = React.useState('#fefb00')
  const [gravityX, setGravityX] = React.useState(0)
  const [gravityY, setGravityY] = React.useState(0)
  const onSubmit = React.useCallback(
    (options: IOptions) => {
      setText(options.text)
      setFillStyle(options.fillStyle)
      setStrokeStyle(options.strokeStyle)
      setGravityX(options.gravityX)
      setGravityY(options.gravityY)
      refresh(count + 1)
    },
    [count],
  )

  return (
    <div>
      <Canvas
        width={window.innerWidth * 0.8}
        height={innerHeight * 0.7}
        text={text}
        fillStyle={fillStyle}
        strokeStyle={strokeStyle}
        gravityX={gravityX}
        gravityY={gravityY}
        count={count}
      />
      <ConfigForm
        text={text}
        fillStyle={fillStyle}
        strokeStyle={strokeStyle}
        gravityX={gravityX}
        gravityY={gravityY}
        onSubmit={onSubmit}
      />
    </div>
  )
}

render(<App />, document.getElementById('root') as any)
