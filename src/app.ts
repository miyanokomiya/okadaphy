
import { Bodies, Body as MBody, Engine, Events, Runner, Vector, Vertices, World } from 'matter-js'
import { ISvgPath, ISvgStyle, IVec2 } from 'okageo'
import * as geo from 'okageo/src/geo'
import * as svg from 'okageo/src/svg'
import { drawFrame, getFrameBodies } from './frame'

// matterがdecompを使うが、parcelのせいかimportがうまくいかない
(window as any).decomp = require('poly-decomp')

interface IBodyShape {
  body: MBody
  style: ISvgStyle
  vertices: IVec2[]
}

interface ISlash {
  line: IVec2[]
  time: number
}

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
    this.engine.world.gravity.scale = 0.00001
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

  public importFromSVG (svgStr: string) {
    const pathInfoList = svg.parseSvgGraphicsStr(svgStr)
    const inRectList = svg.fitRect(pathInfoList, 0, 0, this.canvas.width, this.canvas.height)
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
      const viewVertices = getViewVertices(shape)
      const splited = geo.splitPolyByLine(viewVertices, line)
      if (splited.length < 2) {
        // 変化なし
        nextShapeList.push(shape)
      } else {
        // 分割前を削除
        World.remove(this.engine.world, shape.body)
        // 分割後を追加
        splited.forEach((path) => {
          // 小さすぎるものは除外
          if (geo.getArea(path) < 1) return
          const s = createShape({ d: path, style: shape.style })
          // FIXME なぜかbodyが作られない場合がある
          if (!s.body) return
          MBody.setVelocity(s.body, geo.add(shape.body.velocity, getSlashForce(s.body, line)))
          nextShapeList.push(s)
          World.add(this.engine.world, [s.body])
        })
      }
    })

    this.shapeList = nextShapeList
  }
}

function getSlashForce (body: MBody, slash: IVec2[]) {
  const toSlash = geo.getUnit(geo.sub(slash[1], slash[0]))
  const pedal = geo.getPedal(body.position, slash)
  const toCross = geo.getUnit(geo.sub(body.position, pedal))
  const force = geo.add(toCross, geo.multi(toSlash, 0.3))
  const power = 1 / Math.max(body.mass, 1)
  return geo.multi(geo.getUnit(force), power)
}

function createShape (path: ISvgPath): IBodyShape {
  const polyList = path.d.map((p) => Vector.create(p.x, p.y))
  const center = Vertices.centre(polyList)
  const body = Bodies.fromVertices(
    center.x,
    center.y,
    [polyList]
  )
  return {
    body,
    style: { ...path.style, lineJoin: 'bevel' },
    vertices: path.d.map((p) => ({ x: p.x - center.x, y: p.y - center.y }))
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

function getViewVertices (shape: IBodyShape): IVec2[] {
  return shape.vertices.map((p) => {
    const rotated = geo.rotate(p, shape.body.angle)
    return geo.add(rotated, shape.body.position)
  })
}

function expandLine (a: IVec2, b: IVec2): IVec2[] {
  const v = geo.multi(geo.getUnit(geo.sub(b, a)), 4000)
  return [geo.sub(a, v), geo.add(a, v)]
}
