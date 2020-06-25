import { Body as MBody, Engine, Events, IEventCollision, Runner, World } from 'matter-js'
import okageo, { IVec2, ISvgStyle } from 'okageo'
import { IBodyShape, ISlash } from '../types/index'
import { drawFrame, FRAME_DEPTH, getFrameBodies } from './frame'
import { createShape, mergeShape, splitShape } from './shape'
import { parseFont } from './font'
import { getCursorPoint } from './canvas'

// matterがdecompを使うが、parcelのせいかimportがうまくいかない
;(window as any).decomp = require('poly-decomp')

okageo.svg.configs.bezierSplitSize = 8
okageo.svg.configs.ellipseSplitSize = 8

function expandLine(a: IVec2, b: IVec2): IVec2[] {
  const v = okageo.geo.multi(okageo.geo.getUnit(okageo.geo.sub(b, a)), 4000)
  return [okageo.geo.sub(a, v), okageo.geo.add(a, v)]
}

export default class App {
  private canvas: HTMLCanvasElement
  private clearEventListener: () => void
  private ctx: CanvasRenderingContext2D
  private cursorDownPoint: IVec2 | null
  private cursorMovePoint: IVec2 | null
  private engine: Engine
  private runner: Runner
  private running: boolean
  private shapeList: IBodyShape[]
  private slashList: ISlash[]
  private style: ISvgStyle

  constructor(args: { canvas: HTMLCanvasElement }) {
    this.canvas = args.canvas
    this.clearEventListener = () => {
      return
    }
    this.ctx = args.canvas.getContext('2d') as CanvasRenderingContext2D
    this.cursorDownPoint = null
    this.cursorMovePoint = null
    this.engine = Engine.create()
    this.engine.world.gravity.x = 0
    this.engine.world.gravity.y = 0
    this.runner = Runner.create({})
    this.running = false
    this.shapeList = []
    this.slashList = []
    this.style = {
      ...okageo.svg.createStyle(),
      fill: true,
      fillStyle: 'gray',
      stroke: true,
      strokeStyle: 'yellow',
    }

    // 壁生成
    World.add(this.engine.world, getFrameBodies(this.canvas.width, this.canvas.height))
    this.draw()
    this.stop()
    this.initEventListener()
  }

  public importFromDefault() {
    const pathInfoList = [
      {
        d: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 10, y: 10 },
          { x: 0, y: 10 },
        ],
        style: this.style,
      },
    ]
    const margin = FRAME_DEPTH * 14
    okageo.svg
      .fitRect(
        pathInfoList,
        margin,
        margin,
        this.canvas.width - margin * 2,
        this.canvas.height - margin * 2,
      )
      .map((info) => createShape(info))
      .filter(<T>(info: T | null): info is T => !!info)
      .forEach((s) => {
        MBody.setAngularVelocity(s.body, 0.01)
        this.addShape(s)
      })
    this.draw()
  }

  public importFromSVG(svgStr: string) {
    const pathInfoList = okageo.svg.parseSvgGraphicsStr(svgStr)
    const margin = FRAME_DEPTH
    okageo.svg
      .fitRect(
        pathInfoList,
        margin,
        margin,
        this.canvas.width - margin * 2,
        this.canvas.height - margin * 2,
      )
      .map((info) => createShape(info))
      .filter(<T>(info: T | null): info is T => !!info)
      .forEach((s) => this.addShape(s))
    this.draw()
  }

  public async importFromString(text: string) {
    const pathInfoList = await parseFont(text, this.style)
    const margin = FRAME_DEPTH + 30
    okageo.svg
      .fitRect(
        pathInfoList,
        margin,
        margin,
        this.canvas.width - margin * 2,
        this.canvas.height - margin * 2,
      )
      .map((info) => createShape(info))
      .filter(<T>(info: T | null): info is T => !!info)
      .forEach((s) => this.addShape(s))
    this.draw()
  }

  public setGravity(x: number, y: number) {
    this.engine.world.gravity.x = x
    this.engine.world.gravity.y = y
  }

  public setStyle(style: Partial<ISvgStyle>) {
    this.style = { ...this.style, ...style }
  }

  public run() {
    Runner.start(this.runner, this.engine)
    this.running = true
  }

  public stop() {
    Runner.stop(this.runner)
    this.running = false
  }

  public step() {
    Engine.update(this.engine)
  }

  public clear() {
    Engine.clear(this.engine)
    this.cursorDownPoint = null
    this.shapeList.concat().forEach((s) => this.removeShape(s))
    this.shapeList = []
    this.slashList = []
  }

  public dispose() {
    this.stop()
    Engine.clear(this.engine)
    this.running = false
    this.clearEventListener()
  }

  public isRunning() {
    return this.running
  }

  private draw() {
    if (!this.ctx) return
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    drawFrame(this.ctx)

    this.shapeList.forEach((shape) => {
      this.ctx.save()
      this.ctx.translate(shape.body.position.x, shape.body.position.y)
      this.ctx.rotate(shape.body.angle)
      okageo.svg.draw(this.ctx, {
        d: shape.vertices,
        included: shape.included,
        style: this.style,
      })
      this.ctx.restore()
    })

    this.ctx.strokeStyle = 'yellow'
    this.ctx.lineWidth = 2
    this.slashList.forEach((slash) => {
      this.ctx.beginPath()
      this.ctx.moveTo(slash.line[0].x, slash.line[0].y)
      this.ctx.lineTo(slash.line[1].x, slash.line[1].y)
      this.ctx.stroke()
    })
  }

  private initEventListener() {
    const onCursorDown = (e: MouseEvent | TouchEvent) => this.onCursorDown(e)
    const onCursorUp = (e: MouseEvent | TouchEvent) => this.onCursorUp(e)
    const onCursorMove = (e: MouseEvent | TouchEvent) => this.onCursorMove(e)
    this.canvas.addEventListener('mousedown', onCursorDown, true)
    this.canvas.addEventListener('touchstart', onCursorDown, true)
    this.canvas.addEventListener('mouseup', onCursorUp, true)
    this.canvas.addEventListener('touchend', onCursorUp, true)
    this.canvas.addEventListener('mousemove', onCursorMove, true)
    this.canvas.addEventListener('touchmove', onCursorMove, true)
    this.clearEventListener = () => {
      this.canvas.removeEventListener('mousedown', onCursorDown, true)
      this.canvas.removeEventListener('touchstart', onCursorDown, true)
      this.canvas.removeEventListener('mouseup', onCursorUp, true)
      this.canvas.removeEventListener('touchend', onCursorUp, true)
      this.canvas.removeEventListener('mousemove', onCursorMove, true)
      this.canvas.removeEventListener('touchmove', onCursorMove, true)
    }

    Events.on(this.engine, 'afterUpdate', () => this.afterUpdate())
    // Events.on(this.engine, 'collisionActive', (e) => this.collisionActive(e))
  }

  private addShape(shape: IBodyShape): void {
    World.add(this.engine.world, [shape.body])
    this.shapeList.push(shape)
  }

  private removeShape(shape: IBodyShape): void {
    World.remove(this.engine.world, shape.body)
    this.shapeList.splice(this.shapeList.indexOf(shape), 1)
  }

  private collisionActive(e: IEventCollision<Engine>) {
    e.pairs
      .filter((pair) => pair.timeUpdated - pair.timeCreated > 3000)
      .forEach((pair) => {
        if (Math.random() < 0.99) return

        const shapeA = this.findShape(pair.bodyA.id)
        const shapeB = this.findShape(pair.bodyB.id)
        if (!shapeA || !shapeB) return

        const mergedShape: IBodyShape | null = mergeShape(shapeA, shapeB)
        if (!mergedShape) return

        this.removeShape(shapeA)
        this.removeShape(shapeB)
        this.addShape(mergedShape)
      })
  }

  private findShape(id: number): IBodyShape | null {
    let shape: IBodyShape | null = null
    this.shapeList.some((s) => {
      // partsとして抱えるbodyも検索対象とする
      s.body.parts.some((part) => {
        if (part.id === id) shape = s
        return !!shape
      })
      return !!shape
    })
    return shape
  }

  private afterUpdate() {
    // this.pullCenter()
    // this.pullEachOther()
    this.slashList.forEach((slash) => slash.time++)
    this.slashList = this.slashList.filter((slash) => slash.time < 60)
    this.draw()
  }

  private pullEachOther() {
    this.shapeList.forEach((base) => {
      this.shapeList.forEach((shape) => {
        if (base.body.id === shape.body.id) return

        const vec = okageo.geo.sub(base.body.position, shape.body.position)
        const d = okageo.geo.getNorm(vec)
        if (d < 1) return
        const force = okageo.geo.multi(vec, (0.00001 * base.body.mass) / Math.pow(d, 2))
        MBody.applyForce(shape.body, shape.body.position, force)
      })
    })
  }

  private pullCenter() {
    const center = { x: this.canvas.width / 2, y: this.canvas.height / 2 }
    this.shapeList.forEach((shape) => {
      const vec = okageo.geo.sub(center, shape.body.position)
      const d = okageo.geo.getNorm(vec)
      if (d < 1) return
      const force = okageo.geo.multi(vec, 0.00001 / Math.pow(d, 2))
      MBody.applyForce(shape.body, shape.body.position, force)
    })
  }

  private onCursorDown(e: MouseEvent | TouchEvent) {
    e.preventDefault()
    this.cursorDownPoint = getCursorPoint(e)
  }

  private onCursorMove(e: MouseEvent | TouchEvent) {
    e.preventDefault()
    this.cursorMovePoint = getCursorPoint(e)
  }

  private onCursorUp(e: MouseEvent | TouchEvent) {
    e.preventDefault()
    if (!this.cursorDownPoint || !this.cursorMovePoint) return

    if (okageo.geo.isSame(this.cursorDownPoint, this.cursorMovePoint)) return

    this.slash(expandLine(this.cursorDownPoint, this.cursorMovePoint))
    this.cursorDownPoint = null
  }

  private slash(line: IVec2[]) {
    this.slashList.push({ line, time: 0 })
    this.shapeList.concat().forEach((shape) => {
      const splitedShapeList = splitShape(shape, line)
      if (!splitedShapeList) return

      // 分割前を削除して分割後を追加
      this.removeShape(shape)
      splitedShapeList.forEach((s) => this.addShape(s))
    })

    this.draw()
  }
}
