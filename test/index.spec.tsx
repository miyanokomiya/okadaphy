import * as React from 'react'
import renderer from 'react-test-renderer'
import { App } from '../src/index'

jest.mock('@material-ui/core/Slider', () => 'Slider')
jest.mock('@material-ui/core/TextField', () => 'TextField')
jest.mock('react-color', () => ({ CompactPicker: 'CompactPicker' }))

describe('src/components/ConfigForm', () => {
  it('snapshot', () => {
    const tree = renderer.create(<App />).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
