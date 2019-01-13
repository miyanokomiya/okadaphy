import { IBodyShape } from '../types/index'
import { Bodies, Body as MBody, Vector, Vertices } from 'matter-js'
import { ISvgPath, IVec2 } from 'okageo'
import * as geo from 'okageo/src/geo'

export function mergeShape (shapeA: IBodyShape, shapeB: IBodyShape): IBodyShape | null {
  const rate = shapeA.body.area / shapeB.body.area
  if (rate < 0.6 || 1.4 < rate) return null

  const center = geo.getCenter(shapeA.body.position, shapeB.body.position)
  const count = Math.random() * 13 + 3
  const radius = geo.getRegularPolygonRadius(
    shapeA.body.area + shapeA.body.area,
    count
  )
  const points: IVec2[] = []
  for (let i = 0; i < count; i++) {
    const t = 2 * Math.PI / count * i
    points.push({
      x: center.x + radius * Math.cos(t),
      y: center.y + radius * Math.sin(t)
    })
  }
  const shape = createShape({
    d: points,
    style: shapeA.style
  })
  if (!shape.body) return null

  MBody.applyForce(shape.body, shape.body.position, geo.add(
    shapeA.body.force,
    shapeB.body.force
  ))
  return shape
}

export function createShape (path: ISvgPath): IBodyShape {
  const polyList = path.d.map((p) => Vector.create(p.x, p.y))
  const center = Vertices.centre(polyList)
  const body = Bodies.fromVertices(
    center.x,
    center.y,
    [polyList]
  )
  if (body) {
    body.friction = 0
    body.frictionAir = 0
  }
  const vertices = path.d.map((p) => ({ x: p.x - body.position.x, y: p.y - body.position.y }))
  return {
    body,
    style: {
      ...path.style,
      fill: true,
      lineJoin: 'bevel',
      stroke: true
    },
    vertices
  }
}

export function getSlashForce (body: MBody, slash: IVec2[]) {
  const toSlash = geo.getUnit(geo.sub(slash[1], slash[0]))
  const pedal = geo.getPedal(body.position, slash)
  const toCross = geo.getUnit(geo.sub(body.position, pedal))
  const force = geo.add(toCross, geo.multi(toSlash, 0.3))
  const power = 3 / Math.max(Math.min(body.mass, 5), 1)
  return geo.multi(geo.getUnit(force), power)
}

export function splitShape (shape: IBodyShape, line: IVec2[]): IBodyShape[] | null {
  const viewVertices = getViewVertices(shape)
  const splited = geo.splitPolyByLine(viewVertices, line)
  if (splited.length < 2) return null

  // 分割後shape生成
  const splitedShapeList: IBodyShape[] = []
  splited.forEach((path) => {
    // 小さすぎるものは除外
    if (geo.getArea(path) < 1) return
    const s = createShape({ d: path, style: shape.style })
    // 不適bodyは無視
    if (!s.body) return
    splitedShapeList.push(s)
  })
  if (splitedShapeList.length !== splited.length) return null

  // スラッシュ反動付与
  splitedShapeList.forEach((s) => {
    MBody.setVelocity(
      s.body,
      geo.add(shape.body.velocity, getSlashForce(s.body, line))
    )
  })
  return splitedShapeList
}

export function getViewVertices (shape: IBodyShape): IVec2[] {
  return shape.vertices.map((p) => {
    const rotated = geo.rotate(p, shape.body.angle)
    return geo.add(rotated, shape.body.position)
  })
}

