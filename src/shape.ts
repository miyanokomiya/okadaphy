import { Bodies, Body as MBody, Vector, Vertices } from 'matter-js'
import { ISvgPath, IVec2 } from 'okageo'
import * as geo from 'okageo/src/geo'
import { IBodyShape } from '../types/index'

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
  if (!shape) return null

  MBody.applyForce(shape.body, shape.body.position, geo.add(
    shapeA.body.force,
    shapeB.body.force
  ))
  return shape
}

export function createShape (path: ISvgPath): IBodyShape | null {
  // 同一座標を取り除いておく
  const d = geo.omitSamePoint(path.d)
  const included = (path.included || []).map((inner) => {
    return geo.omitSamePoint(inner)
  })

  const poly = d.map((p) => Vector.create(p.x, p.y))
  const center = Vertices.centre(poly)
  const body = Bodies.fromVertices(
    center.x,
    center.y,
    [poly]
  )

  if (!body) return null

  if (body) {
    body.friction = 0
    body.frictionAir = 0
  }
  const vertices = d.map((p) => ({ x: p.x - body.position.x, y: p.y - body.position.y }))
  return {
    body,
    included: included.map((inner: IVec2[]) => {
      return inner.map((p) => (
        { x: p.x - body.position.x, y: p.y - body.position.y }
      ))
    }),
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
  // 包含ポリゴンと共に全て分割
  const viewVertices = getViewVertices(shape)
  const viewIncluded = getViewIncluded(shape)

  let splited = geo.splitPolyByLine(viewVertices, line)
  if (splited.length < 2) return null

  // 本体と回転方向が一致しているかで分類
  const rootLoopwise = geo.getLoopwise(viewVertices)
  const sameLoopwiseList: IVec2[][] = []
  const oppositeLoopwiseList: IVec2[][] = []
  viewIncluded.forEach((s) => {
    if (geo.getLoopwise(s) === rootLoopwise) {
      sameLoopwiseList.push(s)
    } else {
      oppositeLoopwiseList.push(s)
    }
  })

  // 本体と同回転のものはそのまま分割
  sameLoopwiseList.forEach((poly) => {
    const sp = geo.splitPolyByLine(poly, line)
    splited = [...splited, ...(sp.length > 0 ? sp : [poly])]
  })

  // 本体と逆回転のものは特殊処理
  const notPolyList: IVec2[][] = []
  oppositeLoopwiseList.forEach((poly) => {
    const sp = geo.splitPolyByLine(poly, line)
    if (sp.length > 0) {
      // 分割されたらブーリアン差をとるために集める
      notPolyList.push(poly)
    } else {
      // 分割なしならそのまま
      splited.push(poly)
    }
  })

  // 切断されたくり抜き領域を差し引いたポリゴンを生成
  const splitedAfterNot = splited.map((s) => {
    return notPolyList.reduce((p, c) => {
      return geo.getPolygonNotPolygon(p, c)
    }, s)
  })

  // 包含関係で再度グルーピング
  const groups = geo.getIncludedPolygonGroups(splitedAfterNot)

  // 分割後shape生成
  const splitedShapeList: IBodyShape[] = []
  groups.forEach((group) => {
    const [path, ...included] = group
    // 小さすぎるものは除外
    if (geo.getArea(path) < 1) return
    const s = createShape({ d: path, included, style: shape.style })
    // 不適bodyは無視
    if (!s) return
    splitedShapeList.push(s)
  })
  if (splitedShapeList.length !== groups.length) return null

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

export function getViewIncluded (shape: IBodyShape): IVec2[][] {
  return shape.included.map((poly) => {
    return poly.map((p) => {
      const rotated = geo.rotate(p, shape.body.angle)
      return geo.add(rotated, shape.body.position)
    })
  })
}
