import * as React from 'react'
import PropTypes from 'prop-types'
import App from './app'

type Props = {
  width?: number
  height?: number
  text: string
}

const Canvas: React.FC<Props> = props => {
  const canvasRef = React.useRef(null)
  React.useEffect(() => {
    const app = new App({ canvas: canvasRef.current as any })
    app.importFromString({
      fillStyle: 'black',
      strokeStyle: 'yellow',
      text: props.text,
    })
    app.run()
    return () => app.dispose()
  }, [props.text])

  return <canvas ref={canvasRef} width={props.width} height={props.height} />
}

Canvas.propTypes = {
  width: PropTypes.number,
  height: PropTypes.number,
  text: PropTypes.string.isRequired,
}
Canvas.defaultProps = {
  width: 300,
  height: 300,
}

export default Canvas
