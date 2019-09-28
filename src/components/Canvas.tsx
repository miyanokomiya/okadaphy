import * as React from 'react'
import PropTypes from 'prop-types'
import Grid from '@material-ui/core/Grid'
import Button from '@material-ui/core/Button'
import App from '../app'
import { IConfig } from '../../types'

export type Props = {
  width?: number
  height?: number
  config: IConfig
  count?: number
}

const Canvas: React.FC<Props> = props => {
  const canvasRef = React.useRef(null)
  const [app, setApp] = React.useState<App | null>(null)
  const [running, setRunning] = React.useState(true)

  // app初期化と片付け
  React.useEffect(() => {
    const app = new App({ canvas: canvasRef.current as any })
    app.run()
    setApp(app)
    setRunning(true)
    return () => app.dispose()
  }, [])

  // テキストインポート
  React.useEffect(() => {
    if (!app) return
    app.clear()
    app.importFromString(props.config.text)
  }, [app, props.config.text, props.count])

  // プロパティ反映
  React.useEffect(() => {
    if (!app) return
    app.setGravity(props.config.gravityX, props.config.gravityY)
    app.setStyle({ fillStyle: props.config.fillStyle, strokeStyle: props.config.strokeStyle })
  }, [
    app,
    props.config.gravityX,
    props.config.gravityY,
    props.config.fillStyle,
    props.config.strokeStyle,
  ])

  const onClickPlay = React.useCallback(() => {
    if (!app) return
    running ? app.stop() : app.run()
    setRunning(!running)
  }, [app, running])

  const onClickStep = React.useCallback(() => {
    if (!app) return
    app.step()
  }, [app])

  return (
    <div>
      <canvas ref={canvasRef} width={props.width} height={props.height} />
      <Grid container spacing={2}>
        <Grid item>
          <Button
            variant="contained"
            color={running ? 'secondary' : 'primary'}
            onClick={onClickPlay}
          >
            {running ? 'Pause' : 'Start'}
          </Button>
        </Grid>
        <Grid item>
          <Button variant="contained" onClick={onClickStep}>
            Step
          </Button>
        </Grid>
      </Grid>
    </div>
  )
}

Canvas.propTypes = {
  width: PropTypes.number,
  height: PropTypes.number,
  config: PropTypes.shape({
    text: PropTypes.string.isRequired,
    fillStyle: PropTypes.string.isRequired,
    strokeStyle: PropTypes.string.isRequired,
    gravityX: PropTypes.number.isRequired,
    gravityY: PropTypes.number.isRequired,
  }).isRequired,
  count: PropTypes.number,
}
Canvas.defaultProps = {
  width: 300,
  height: 300,
  count: 0,
}

export default Canvas
