import * as React from 'react'
import renderer from 'react-test-renderer'
import OptionForm, { Props } from '../../src/components/ConfigForm'
import { mockConfig } from '../mock'

jest.mock('@material-ui/core/Slider', () => 'Slider')
jest.mock('@material-ui/core/TextField', () => 'TextField')
jest.mock('react-color', () => ({ CompactPicker: 'CompactPicker' }))

describe('src/components/ConfigForm', () => {
  it('snapshot', () => {
    const props: Props = {
      config: mockConfig(),
      onSubmit: () => {},
    }
    const tree = renderer.create(<OptionForm {...props} />).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
