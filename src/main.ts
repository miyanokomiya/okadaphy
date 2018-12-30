import { Bodies, Body as MBody, Engine, Events, Vector, Vertices, World } from 'matter-js'
import * as svg from 'okageo/src/svg'
import { ISvgPath, ISvgStyle, IVec2 } from 'okageo/types'
import { drawFrame, getFrameBodies } from './frame'

// matterがdecompを使うが、parcelのせいかimportがうまくいかない
(window as any).decomp = require('poly-decomp')

const canvas = document.getElementById('canvas') as HTMLCanvasElement
const ctx = canvas.getContext('2d')

interface IBodyShape {
  body: MBody
  style: ISvgStyle
  vertices: IVec2[]
}

const shapeList: IBodyShape[] = []

function createBody (path: ISvgPath): void {
  const polyList = path.d.map((p) => Vector.create(p.x, p.y))
  const center = Vertices.centre(polyList)
  const body = Bodies.fromVertices(
    center.x,
    center.y,
    [polyList]
  )
  shapeList.push({
    body,
    style: { ...path.style, lineJoin: 'bevel' },
    vertices: path.d.map((p) => ({ x: p.x - center.x, y: p.y - center.y }))
  })
  World.add(engine.world, [body])
}

const fileInput = document.getElementById('input') as HTMLInputElement
fileInput.onchange = (e) => {
  const file = (e.target as HTMLInputElement).files
  if (!file || file.length === 0) return

  const reader = new FileReader()
  reader.readAsText(file[0])
  reader.onload = () => {
    const pathInfoList = svg.parseSvgGraphicsStr(reader.result as string)
    const inRectList = svg.fitRect(pathInfoList, 0, 0, canvas.width, canvas.height)
    inRectList.forEach((info) => createBody(info))
  }
}

// create an engine
const engine = Engine.create()

// add all of the bodies to the world
World.add(engine.world, getFrameBodies(canvas.width, canvas.height))

// run the engine
Engine.run(engine)

Events.on(engine, 'afterUpdate', () => {
  if (!ctx) return
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  drawFrame(ctx)
  shapeList.forEach((shape) => {
    ctx.save()
    ctx.translate(shape.body.position.x, shape.body.position.y)
    ctx.rotate(shape.body.angle)
    svg.draw(ctx, {
      d: shape.vertices,
      style: shape.style
    })
    ctx.restore()
  })
})
