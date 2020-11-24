import type { IVec2 } from 'okageo'

export function getCursorPoint(e: MouseEvent | TouchEvent): IVec2 {
  const rect = (e.target as HTMLCanvasElement).getBoundingClientRect()
  const positionX = rect.left + window.pageXOffset
  const positionY = rect.top + window.pageYOffset

  if (e instanceof MouseEvent) {
    return {
      x: e.pageX - positionX,
      y: e.pageY - positionY,
    }
  } else {
    const touch = e.touches[0]
    return {
      x: touch.pageX - positionX,
      y: touch.pageY - positionY,
    }
  }
}
