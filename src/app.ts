
import { Bodies, Body as MBody, Engine, Events, Runner, Vector, Vertices, World } from 'matter-js'
import { ISvgPath, ISvgStyle, IVec2 } from 'okageo'
import * as svg from 'okageo/src/svg'
import { drawFrame, getFrameBodies } from './frame'

// matterがdecompを使うが、parcelのせいかimportがうまくいかない
(window as any).decomp = require('poly-decomp')

interface IBodyShape {
  body: MBody
  style: ISvgStyle
  vertices: IVec2[]
}

export default class App {
  private engine: Engine
  private runner: Runner
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private shapeList: IBodyShape[]
  private running: boolean

  constructor (args: { canvas: HTMLCanvasElement }) {
    this.canvas = args.canvas
    this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D
    this.engine = Engine.create()
    this.engine.world.gravity.scale = 0.00001
    this.runner = Runner.create({})
    this.shapeList = []
    this.running = false

    // 壁生成
    World.add(this.engine.world, getFrameBodies(this.canvas.width, this.canvas.height))
    this.draw()
    this.stop()

    Events.on(this.engine, 'afterUpdate', () => this.draw())
  }

  public importFromSVG (svgStr: string) {
    const pathInfoList = svg.parseSvgGraphicsStr(svgStr)
    const inRectList = svg.fitRect(pathInfoList, 0, 0, this.canvas.width, this.canvas.height)
    inRectList.forEach((info) => this.createBody(info))
    this.draw()
  }

  public run () {
    Runner.start(this.runner, this.engine)
    this.running = true
  }

  public stop () {
    Runner.stop(this.runner)
    this.running = false
  }

  public dispose () {
    Engine.clear(this.engine)
    this.running = false
  }

  public isRunning () {
    return this.running
  }

  private draw () {
    if (!this.ctx) return
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    drawFrame(this.ctx)
    this.shapeList.forEach((shape) => {
      this.ctx.save()
      this.ctx.translate(shape.body.position.x, shape.body.position.y)
      this.ctx.rotate(shape.body.angle)
      svg.draw(this.ctx, {
        d: shape.vertices,
        style: shape.style
      })
      this.ctx.restore()
    })
  }

  private createBody (path: ISvgPath): void {
    const polyList = path.d.map((p) => Vector.create(p.x, p.y))
    const center = Vertices.centre(polyList)
    const body = Bodies.fromVertices(
      center.x,
      center.y,
      [polyList]
    )
    this.shapeList.push({
      body,
      style: { ...path.style, lineJoin: 'bevel' },
      vertices: path.d.map((p) => ({ x: p.x - center.x, y: p.y - center.y }))
    })
    World.add(this.engine.world, [body])
  }
}
