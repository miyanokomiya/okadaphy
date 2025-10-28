import 'regenerator-runtime/runtime'
import * as React from 'react'
import { render } from 'react-dom'
import Link from '@material-ui/core/Link'
import Canvas from './components/Canvas'
import ConfigForm from './components/ConfigForm'
import type { IConfig } from './types'

export const App: React.FC = () => {
  const [count, refresh] = React.useState(0)
  const [config, setConfig] = React.useState({
    text: '岡田を\n切る技術',
    fillStyle: '#000',
    strokeStyle: '#fefb00',
    gravityX: 0,
    gravityY: 0,
  })

  const onSubmit = React.useCallback(
    (config: IConfig, force = false) => {
      setConfig(config)
      if (force) refresh(count + 1)
    },
    [count],
  )

  return (
    <div>
      <Canvas
        width={window.innerWidth - 16}
        height={innerHeight * 0.7}
        config={config}
        count={count}
      />
      <div style={{ marginTop: '1rem' }}>
        <ConfigForm config={config} onSubmit={onSubmit} />
      </div>
      <Link href="https://github.com/miyanokomiya/okadaphy">Github</Link>
    </div>
  )
}

const root = document.getElementById('root')
if (root) {
  render(<App />, root)
}
