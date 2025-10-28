import { Body as MBody } from 'matter-js'
import type { ISvgStyle, IVec2 } from 'okageo'

export interface IBodyShape {
  body: MBody
  style: ISvgStyle
  vertices: IVec2[]
  included: IVec2[][]
}

export interface ISlash {
  line: IVec2[]
  time: number
}

export interface IConfig {
  text: string
  fillStyle: string
  strokeStyle: string
  gravityX: number
  gravityY: number
}
