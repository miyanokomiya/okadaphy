import * as React from 'react'
import PropTypes from 'prop-types'
import { IOptions } from '../types'

type Props = IOptions & {
  onSubmit: (options: IOptions) => void
}

const OptionForm: React.FC<Props> = props => {
  const [draftText, setDraftText] = React.useState(props.text)
  const [draftFillStyle, setDraftFillStyle] = React.useState(props.fillStyle)
  const [draftStrokeStyle, setDraftStrokeStyle] = React.useState(props.strokeStyle)
  const [draftGravityX, setDraftGravityX] = React.useState(props.gravityX)
  const [draftGravityY, setDraftGravityY] = React.useState(props.gravityY)

  const onInputDraftText = React.useCallback((e: React.FormEvent<HTMLTextAreaElement>) => {
    setDraftText(e.currentTarget.value)
  }, [])
  const onInputDraftFillStyle = React.useCallback((e: React.FormEvent<HTMLInputElement>) => {
    setDraftFillStyle(e.currentTarget.value)
  }, [])
  const onInputDraftStrokeStyle = React.useCallback((e: React.FormEvent<HTMLInputElement>) => {
    setDraftStrokeStyle(e.currentTarget.value)
  }, [])
  const onInputDraftGravityX = React.useCallback((e: React.FormEvent<HTMLInputElement>) => {
    setDraftGravityX(parseFloat(e.currentTarget.value))
  }, [])
  const onInputDraftGravityY = React.useCallback((e: React.FormEvent<HTMLInputElement>) => {
    setDraftGravityY(parseFloat(e.currentTarget.value))
  }, [])

  const onSubmit = React.useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      props.onSubmit({
        text: draftText,
        fillStyle: draftFillStyle,
        strokeStyle: draftStrokeStyle,
        gravityX: draftGravityX,
        gravityY: draftGravityY,
      })
    },
    [props, draftText, draftFillStyle, draftStrokeStyle, draftGravityX, draftGravityY],
  )

  return (
    <form onSubmit={onSubmit}>
      <textarea cols={30} rows={3} value={draftText} onChange={onInputDraftText} />
      <button>Run</button>
      <br />
      <br />
      面:
      <input type="color" value={draftFillStyle} onChange={onInputDraftFillStyle} />
      <br />
      線:
      <input type="color" value={draftStrokeStyle} onChange={onInputDraftStrokeStyle} />
      <br />
      重力x:
      <input
        min="-0.05"
        max="0.05"
        step="0.0001"
        type="range"
        value={draftGravityX}
        onChange={onInputDraftGravityX}
      />
      <br />
      重力y:
      <input
        min="-0.05"
        max="0.05"
        step="0.0001"
        type="range"
        value={draftGravityY}
        onChange={onInputDraftGravityY}
      />
    </form>
  )
}

OptionForm.propTypes = {
  text: PropTypes.string.isRequired,
  fillStyle: PropTypes.string.isRequired,
  strokeStyle: PropTypes.string.isRequired,
  gravityX: PropTypes.number.isRequired,
  gravityY: PropTypes.number.isRequired,
  onSubmit: PropTypes.func.isRequired,
}
OptionForm.defaultProps = {}

export default OptionForm
