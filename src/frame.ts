import { Bodies, Body as MBody } from 'matter-js'

const frameDepth = 30

export function getFrameBodies (width: number, height: number): MBody[] {
  const frameTop = Bodies.rectangle(
    width / 2,
    0,
    width,
    frameDepth,
    { isStatic: true }
  )
  const frameBottom = Bodies.rectangle(
    width / 2,
    height,
    width,
    frameDepth,
    { isStatic: true }
  )
  const frameLeft = Bodies.rectangle(
    0,
    height / 2,
    frameDepth,
    height,
    { isStatic: true }
  )
  const frameRight = Bodies.rectangle(
    width,
    height / 2,
    frameDepth,
    height,
    { isStatic: true }
  )
  return [frameTop, frameBottom, frameLeft, frameRight]
}

export function drawFrame (ctx: CanvasRenderingContext2D): void {
  if (!ctx) return
  ctx.fillStyle = 'gray'
  ctx.beginPath()
  ctx.rect(
    0,
    -frameDepth / 2,
    ctx.canvas.clientWidth,
    frameDepth
  )
  ctx.rect(
    0,
    ctx.canvas.clientHeight - frameDepth / 2,
    ctx.canvas.clientWidth,
    frameDepth
  )
  ctx.rect(
    -frameDepth / 2, 0,
    frameDepth,
    ctx.canvas.clientHeight
  )
  ctx.rect(
    ctx.canvas.clientWidth - frameDepth / 2,
    0,
    frameDepth,
    ctx.canvas.clientHeight
  )
  ctx.fill()
}
