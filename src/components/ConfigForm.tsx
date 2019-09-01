import * as React from 'react'
import Grid from '@material-ui/core/Grid'
import Button from '@material-ui/core/Button'
import TextField from '@material-ui/core/TextField'
import Slider from '@material-ui/core/Slider'
import Typography from '@material-ui/core/Typography'
import { CompactPicker, ColorResult } from 'react-color'
import PropTypes from 'prop-types'
import { IOptions } from '../../types'

type Props = IOptions & {
  onSubmit: (options: IOptions) => void
}

const OptionForm: React.FC<Props> = props => {
  const [draftText, setDraftText] = React.useState(props.text)
  const [draftFillStyle, setDraftFillStyle] = React.useState(props.fillStyle)
  const [draftStrokeStyle, setDraftStrokeStyle] = React.useState(props.strokeStyle)
  const [draftGravityX, setDraftGravityX] = React.useState(props.gravityX)
  const [draftGravityY, setDraftGravityY] = React.useState(props.gravityY)

  const onInputDraftText = React.useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDraftText(e.currentTarget.value)
  }, [])
  const onInputDraftFillStyle = React.useCallback((color: ColorResult) => {
    setDraftFillStyle(color.hex)
  }, [])
  const onInputDraftStrokeStyle = React.useCallback((color: ColorResult) => {
    setDraftStrokeStyle(color.hex)
  }, [])
  const onInputDraftGravityX = React.useCallback((_, value: any) => {
    setDraftGravityX(value)
  }, [])
  const onInputDraftGravityY = React.useCallback((_, value: any) => {
    setDraftGravityY(value)
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
      <Grid container>
        <Grid item>
          <Button type="submit" variant="contained" color="primary">
            Run
          </Button>
        </Grid>
      </Grid>
      <Grid container style={{ marginTop: '1rem' }}>
        <Grid item xs={12}>
          <Typography>Text</Typography>
          <TextField
            multiline
            fullWidth
            variant="outlined"
            value={draftText}
            onChange={onInputDraftText}
          />
        </Grid>
      </Grid>
      <Grid container style={{ marginTop: '1rem' }} spacing={2}>
        <Grid item>
          <Typography>Fill</Typography>
          <CompactPicker color={draftFillStyle} onChange={onInputDraftFillStyle} />
        </Grid>
        <Grid item>
          <Typography>Stroke</Typography>
          <CompactPicker color={draftStrokeStyle} onChange={onInputDraftStrokeStyle} />
        </Grid>
      </Grid>
      <Grid container style={{ marginTop: '1rem' }} spacing={2}>
        <Grid item xs={12} sm={6}>
          <Typography>Gravity X</Typography>
          <Slider
            marks={[{ value: 0, label: '0' }]}
            valueLabelFormat={v => v * 1000}
            step={0.0001}
            min={-0.05}
            max={0.05}
            value={draftGravityX}
            onChange={onInputDraftGravityX}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography>Gravity Y</Typography>
          <Slider
            valueLabelFormat={v => v * 1000}
            marks={[{ value: 0, label: '0' }]}
            step={0.0001}
            min={-0.05}
            max={0.05}
            value={draftGravityY}
            onChange={onInputDraftGravityY}
          />
        </Grid>
      </Grid>
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
