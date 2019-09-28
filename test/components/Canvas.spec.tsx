import * as React from 'react'
import renderer from 'react-test-renderer'
import Canvas, { Props } from '../../src/components/Canvas'
import { mockConfig } from '../mock'

jest.mock('@material-ui/core/Slider', () => 'Slider')
jest.mock('@material-ui/core/TextField', () => 'TextField')
jest.mock('react-color', () => ({ CompactPicker: 'CompactPicker' }))

describe('src/components/ConfigForm', () => {
  it('snapshot', () => {
    const props: Props = {
      config: mockConfig(),
      width: 100,
      height: 200,
      count: 1,
    }
    const tree = renderer.create(<Canvas {...props} />).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
