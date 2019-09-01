import * as React from 'react'
import PropTypes from 'prop-types'
import App from '../app'
import { IConfig } from '../../types'

type Props = {
  width?: number
  height?: number
  config: IConfig
  count?: number
}

const Canvas: React.FC<Props> = props => {
  const canvasRef = React.useRef(null)
  const [app, setApp] = React.useState<App | null>(null)

  // app初期化と片付け
  React.useEffect(() => {
    const app = new App({ canvas: canvasRef.current as any })
    app.run()
    setApp(app)
    return () => app.dispose()
  }, [])

  // テキストインポート
  React.useEffect(() => {
    if (!app) return
    app.clear()
    app.importFromString(props.config.text)
  }, [props.config.text, props.count, app])

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

  return <canvas ref={canvasRef} width={props.width} height={props.height} />
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
