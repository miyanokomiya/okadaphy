import { Bodies, Body as MBody, Engine, Events, IEventCollision, Runner, Vector, Vertices, World } from 'matter-js'
import { ISvgPath, IVec2 } from 'okageo'
import * as geo from 'okageo/src/geo'
import * as svg from 'okageo/src/svg'
import { IBodyShape, ISlash } from '../types/index'
import { drawFrame, FRAME_DEPTH, getFrameBodies } from './frame'
import { createShape, getSlashForce, getViewVertices, mergeShape, splitShape } from './shape'

// matterがdecompを使うが、parcelのせいかimportがうまくいかない
(window as any).decomp = require('poly-decomp')

export default class App {
  private engine: Engine
  private runner: Runner
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private shapeList: IBodyShape[]
  private running: boolean
  private clearEventListener: () => void
  private cursorDownPoint: IVec2 | null
  private slashList: ISlash[]

  constructor (args: { canvas: HTMLCanvasElement }) {
    this.canvas = args.canvas
    this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D
    this.engine = Engine.create()
    this.engine.world.gravity.scale = 0
    this.runner = Runner.create({})
    this.shapeList = []
    this.running = false
    this.clearEventListener = () => { return }
    this.cursorDownPoint = null
    this.slashList = []

    // 壁生成
    World.add(this.engine.world, getFrameBodies(this.canvas.width, this.canvas.height))
    this.draw()
    this.stop()
    this.initEventListener()
  }

  public importFromDefault () {
    const pathInfoList = [{
      d: [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }],
      style: {
        fill: true,
        fillGlobalAlpha: 1,
        fillStyle: 'gray',
        lineCap: 'butt',
        lineDash: [],
        lineJoin: 'bevel',
        lineWidth: 1,
        stroke: true,
        strokeGlobalAlpha: 1,
        strokeStyle: 'yellow'
      }
    }]
    const margin = FRAME_DEPTH * 14
    const inRectList = svg.fitRect(
      pathInfoList,
      margin,
      margin,
      this.canvas.width - margin * 2,
      this.canvas.height - margin * 2
    )
    inRectList.forEach((info) => {
      const shape = createShape(info)
      this.shapeList.push(shape)
      World.add(this.engine.world, [shape.body])
    })
    this.draw()
  }

  public importFromSVG (svgStr: string) {
    const pathInfoList = svg.parseSvgGraphicsStr(svgStr)
    const margin = FRAME_DEPTH
    const inRectList = svg.fitRect(
      pathInfoList,
      margin,
      margin,
      this.canvas.width - margin * 2,
      this.canvas.height - margin * 2
    )
    inRectList.forEach((info) => {
      const shape = createShape(info)
      this.shapeList.push(shape)
      World.add(this.engine.world, [shape.body])
    })
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
    this.stop()
    Engine.clear(this.engine)
    this.running = false
    this.clearEventListener()
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

    this.ctx.strokeStyle = 'yellow'
    this.ctx.lineWidth = 2
    this.slashList.forEach((slash) => {
      this.ctx.beginPath()
      this.ctx.moveTo(slash.line[0].x, slash.line[0].y)
      this.ctx.lineTo(slash.line[1].x, slash.line[1].y)
      this.ctx.stroke()
    })
  }

  private initEventListener () {
    const onCursorDown = (e: MouseEvent | TouchEvent) => this.onCursorDown(e)
    const onCursorUp = (e: MouseEvent | TouchEvent) => this.onCursorUp(e)
    this.canvas.addEventListener('mousedown', onCursorDown, true)
    this.canvas.addEventListener('touchstart', onCursorDown, true)
    this.canvas.addEventListener('mouseup', onCursorUp, true)
    this.canvas.addEventListener('touchend', onCursorUp, true)
    this.clearEventListener = () => {
      this.canvas.removeEventListener('mousedown', onCursorDown, true)
      this.canvas.removeEventListener('touchstart', onCursorDown, true)
      this.canvas.removeEventListener('mouseup', onCursorUp, true)
      this.canvas.removeEventListener('touchend', onCursorUp, true)
    }

    Events.on(this.engine, 'afterUpdate', () => this.afterUpdate())
    Events.on(this.engine, 'collisionActive', (e) => this.collisionActive(e))
  }

  private collisionActive (e: IEventCollision<Engine>) {
    const pairs = e.pairs
    const index = Math.floor(Math.random() * pairs.length)
    const pair = pairs[index]
    const shapeA = this.findShape(pair.bodyA.id)
    const shapeB = this.findShape(pair.bodyB.id)
    if (!shapeA || !shapeB) return

    const mergedShape: IBodyShape | null = mergeShape(shapeA, shapeB)
    if (!mergedShape) return

    World.remove(this.engine.world, shapeA.body)
    World.remove(this.engine.world, shapeB.body)
    this.shapeList.splice(this.shapeList.indexOf(shapeA), 1)
    this.shapeList.splice(this.shapeList.indexOf(shapeB), 1)
    World.add(this.engine.world, [mergedShape.body])
    this.shapeList.push(mergedShape)

  }

  private findShape (id: number): IBodyShape | null {
    let shape: IBodyShape | null = null
    this.shapeList.some((s) => {
      s.body.parts.some((part) => {
        if (part.id === id) shape = s
        return !!shape
      })
      return !!shape
    })
    return shape
  }

  private afterUpdate () {
    this.slashList.forEach((slash) => slash.time++)
    this.slashList = this.slashList.filter((slash) => slash.time < 60)
    this.draw()
  }

  private onCursorDown (e: MouseEvent | TouchEvent) {
    this.cursorDownPoint = getCursorPoint(e)
  }

  private onCursorUp (e: MouseEvent | TouchEvent) {
    if (!this.cursorDownPoint) return

    const p = getCursorPoint(e)
    if (geo.isSame(this.cursorDownPoint, p)) return

    this.slash(expandLine(this.cursorDownPoint, p))
    this.cursorDownPoint = null
  }

  private slash (line: IVec2[]) {
    this.slashList.push({ line, time: 0 })
    const nextShapeList: IBodyShape[] = []
    this.shapeList.forEach((shape) => {
      const splitedShapeList = splitShape(shape, line)
      if (!splitedShapeList) {
        nextShapeList.push(shape)
        return
      }

      // 分割前を削除して分割後を追加
      World.remove(this.engine.world, shape.body)
      splitedShapeList.forEach((s) => {
        World.add(this.engine.world, [s.body])
        nextShapeList.push(s)
      })
    })

    this.shapeList = nextShapeList
    this.draw()
  }
}

function getCursorPoint (e: MouseEvent | TouchEvent): IVec2 {
  const rect = (e.target as HTMLCanvasElement).getBoundingClientRect()
  const positionX = rect.left + window.pageXOffset
  const positionY = rect.top + window.pageYOffset

  if (e instanceof TouchEvent) {
    const touch = e.touches[0]
    return {
      x : touch.pageX - positionX,
      y : touch.pageY - positionY
    }
  } else {
    return {
      x : e.pageX - positionX,
      y : e.pageY - positionY
    }
  }
}

function expandLine (a: IVec2, b: IVec2): IVec2[] {
  const v = geo.multi(geo.getUnit(geo.sub(b, a)), 4000)
  return [geo.sub(a, v), geo.add(a, v)]
}
