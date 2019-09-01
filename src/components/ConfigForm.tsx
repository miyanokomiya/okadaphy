import * as React from 'react'
import Grid from '@material-ui/core/Grid'
import Button from '@material-ui/core/Button'
import TextField from '@material-ui/core/TextField'
import Slider from '@material-ui/core/Slider'
import Typography from '@material-ui/core/Typography'
import { CompactPicker, ColorResult } from 'react-color'
import PropTypes from 'prop-types'
import { IConfig } from '../../types'

type Props = {
  config: IConfig
  onSubmit: (options: IConfig, force?: boolean) => void
}

const OptionForm: React.FC<Props> = props => {
  const [draftText, setDraftText] = React.useState(props.config.text)

  const onInputDraftText = React.useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDraftText(e.currentTarget.value)
  }, [])

  const onInputDraftFillStyle = React.useCallback(
    (color: ColorResult) => {
      props.onSubmit({
        ...props.config,
        fillStyle: color.hex,
      })
    },
    [props],
  )

  const onInputDraftStrokeStyle = React.useCallback(
    (color: ColorResult) => {
      props.onSubmit({
        ...props.config,
        strokeStyle: color.hex,
      })
    },
    [props],
  )

  const onInputDraftGravityX = React.useCallback(
    (_, value: any) => {
      props.onSubmit({
        ...props.config,
        gravityX: value,
      })
    },
    [props],
  )

  const onInputDraftGravityY = React.useCallback(
    (_, value: any) => {
      props.onSubmit({
        ...props.config,
        gravityY: value,
      })
    },
    [props],
  )

  const onSubmit = React.useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      props.onSubmit(
        {
          ...props.config,
          text: draftText,
        },
        true,
      )
    },
    [props, draftText],
  )

  return (
    <form onSubmit={onSubmit}>
      <Grid container>
        <Grid item>
          <Button type="submit" variant="contained">
            Reset
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
          <CompactPicker color={props.config.fillStyle} onChange={onInputDraftFillStyle} />
        </Grid>
        <Grid item>
          <Typography>Stroke</Typography>
          <CompactPicker color={props.config.strokeStyle} onChange={onInputDraftStrokeStyle} />
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
            value={props.config.gravityX}
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
            value={props.config.gravityY}
            onChange={onInputDraftGravityY}
          />
        </Grid>
      </Grid>
    </form>
  )
}

OptionForm.propTypes = {
  config: PropTypes.shape({
    text: PropTypes.string.isRequired,
    fillStyle: PropTypes.string.isRequired,
    strokeStyle: PropTypes.string.isRequired,
    gravityX: PropTypes.number.isRequired,
    gravityY: PropTypes.number.isRequired,
  }).isRequired,
  onSubmit: PropTypes.func.isRequired,
}
OptionForm.defaultProps = {}

export default OptionForm
