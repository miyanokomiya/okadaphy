import { Bodies, Body as MBody } from 'matter-js'

// 壁の厚み(半分は画面外)
export const FRAME_DEPTH = 10

export function getFrameBodies(width: number, height: number): MBody[] {
  const frameTop = Bodies.rectangle(width / 2, 0, width, FRAME_DEPTH, { isStatic: true })
  const frameBottom = Bodies.rectangle(width / 2, height, width, FRAME_DEPTH, { isStatic: true })
  const frameLeft = Bodies.rectangle(0, height / 2, FRAME_DEPTH, height, { isStatic: true })
  const frameRight = Bodies.rectangle(width, height / 2, FRAME_DEPTH, height, { isStatic: true })
  return [frameTop, frameBottom, frameLeft, frameRight]
}

export function drawFrame(ctx: CanvasRenderingContext2D): void {
  if (!ctx) return
  ctx.fillStyle = 'gray'
  ctx.beginPath()
  ctx.rect(0, -FRAME_DEPTH / 2, ctx.canvas.clientWidth, FRAME_DEPTH)
  ctx.rect(0, ctx.canvas.clientHeight - FRAME_DEPTH / 2, ctx.canvas.clientWidth, FRAME_DEPTH)
  ctx.rect(-FRAME_DEPTH / 2, 0, FRAME_DEPTH, ctx.canvas.clientHeight)
  ctx.rect(ctx.canvas.clientWidth - FRAME_DEPTH / 2, 0, FRAME_DEPTH, ctx.canvas.clientHeight)
  ctx.fill()
}
