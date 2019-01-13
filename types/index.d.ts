import { Body as MBody } from 'matter-js'
import { ISvgStyle, IVec2 } from 'okageo'

export interface IBodyShape {
  body: MBody
  style: ISvgStyle
  vertices: IVec2[]
}

export interface ISlash {
  line: IVec2[]
  time: number
}
