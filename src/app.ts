import { Bodies, Body as MBody, IEventCollision, Engine, Events, Runner, Vector, Vertices, World } from 'matter-js'
import { ISvgPath, ISvgStyle, IVec2 } from 'okageo'
import * as geo from 'okageo/src/geo'
import * as svg from 'okageo/src/svg'
import { drawFrame, FRAME_DEPTH, getFrameBodies } from './frame'

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
    e.pairs.forEach((pair) => {
      const shapeA = this.findShape(pair.bodyA)
      const shapeB = this.findShape(pair.bodyB)
      if (!shapeA || !shapeB) return
      const merged = mergeShape(shapeA, shapeB)
      if (!merged || !merged.body) return
      World.remove(this.engine.world, shapeA.body)
      World.remove(this.engine.world, shapeB.body)
      this.shapeList.splice(this.shapeList.indexOf(shapeA), 1)
      this.shapeList.splice(this.shapeList.indexOf(shapeB), 1)
      World.add(this.engine.world, [merged.body])
      this.shapeList.push(merged)
    })
  }

  private findShape (body: MBody): IBodyShape | null {
    let target: IBodyShape | null = null
    this.shapeList.some((shape: IBodyShape) => {
      if (shape.body.id === body.id) {
        target = shape
      }
      return !!target
    })
    return target
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
        // 分割後shape生成
        splited.forEach((path) => {
          // 小さすぎるものは除外
          if (geo.getArea(path) < 1) return
          const s = createShape({ d: path, style: shape.style })
          // FIXME なぜかbodyが作られない場合がある
          if (!s.body) return
          // スラッシュ反動付与
          MBody.setVelocity(s.body, geo.add(shape.body.velocity, getSlashForce(s.body, line)))
          World.add(this.engine.world, [s.body])
          nextShapeList.push(s)
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

function mergeShape (a: IBodyShape, b: IBodyShape): IBodyShape | null {
  const verticesA = geo.convertLoopwise(getViewVertices(a))
  const verticesB = geo.convertLoopwise(getViewVertices(b))

  let isLap = false
  let indexA = 0
  let indexB = 0
  verticesA.some((va, ia) => {
    indexA = ia
    const segA = [va, verticesA[(ia + 1) % verticesA.length]]
    verticesB.some((vb, ib) => {
      indexB = ib
      const segB = [vb, verticesB[(ib + 1) % verticesB.length]]
      isLap = isSegOverlapType(segA, segB)
      return isLap
    })
    return isLap
  })

  if (!isLap) return null

  const shiftedA = shiftArray(verticesA, indexA + 1)
  const shiftedB = shiftArray(verticesB, indexB + 1)
  let polygon: IVec2[] = geo.omitSamePoint([...shiftedA, ...shiftedB])
  return createShape({
    d: polygon,
    style: a.style
  })
}

function shiftArray (array: any[], start: number): any[] {
  const ret: any[] = []
  for (let i = 0; i < array.length; i++) {
    ret.push(array[(start + i) % array.length])
  }
  return ret
}

function isSegOverlapType (a: IVec2[], b: IVec2[]): boolean {
  const threshold = 50
  const va = geo.sub(a[0], a[1])
  const vb = geo.sub(b[0], b[1])
  const na = geo.getNorm(va)
  const nb = geo.getNorm(vb)

  if (na * nb < 1) return false

  const isParallel = Math.abs(geo.getCross(va, vb)) / na / nb < Math.cos(Math.PI / 180 * threshold)
  if (!isParallel) return false


  const isOpposite = geo.getInner(va, vb) < 0
  if (!isOpposite) return false

  if (geo.getDistance(a[0], geo.getPedal(a[0], b)) < threshold) {
    const s = geo.getDistance(b[0], a[0])
    const t = geo.getDistance(a[0], b[1])
    const u = geo.getDistance(b[0], b[1])
    if (s + t - u < threshold) return true
  }
  if (geo.getDistance(a[1], geo.getPedal(a[1], b)) < threshold) {
    const s = geo.getDistance(b[0], a[1])
    const t = geo.getDistance(a[1], b[1])
    const u = geo.getDistance(b[0], b[1])
    if (s + t - u < threshold) return true
  }
  if (geo.getDistance(b[0], geo.getPedal(b[0], a)) < threshold) {
    const s = geo.getDistance(a[0], b[0])
    const t = geo.getDistance(b[0], a[1])
    const u = geo.getDistance(a[0], a[1])
    if (s + t - u < threshold) return true
  }
  if (geo.getDistance(b[1], geo.getPedal(b[1], a)) < threshold) {
    const s = geo.getDistance(a[0], b[1])
    const t = geo.getDistance(b[1], a[1])
    const u = geo.getDistance(a[0], a[1])
    if (s + t - u < threshold) return true
  }

  return false
}
