import * as React from 'react'
import PropTypes from 'prop-types'
import App from './app'
import { IOptions } from '../types'

type Props = IOptions & {
  width?: number
  height?: number
  count?: number
}

const Canvas: React.FC<Props> = props => {
  const canvasRef = React.useRef(null)

  React.useEffect(() => {
    const app = new App({ canvas: canvasRef.current as any })
    app.importFromString({
      fillStyle: props.fillStyle,
      strokeStyle: props.strokeStyle,
      text: props.text,
    })
    app.setGravity(props.gravityX, props.gravityY)
    app.run()
    return () => app.dispose()
  }, [props])

  return <canvas ref={canvasRef} width={props.width} height={props.height} />
}

Canvas.propTypes = {
  width: PropTypes.number,
  height: PropTypes.number,
  text: PropTypes.string.isRequired,
  fillStyle: PropTypes.string.isRequired,
  strokeStyle: PropTypes.string.isRequired,
  gravityX: PropTypes.number.isRequired,
  gravityY: PropTypes.number.isRequired,
  count: PropTypes.number,
}
Canvas.defaultProps = {
  width: 300,
  height: 300,
  count: 0,
}

export default Canvas
