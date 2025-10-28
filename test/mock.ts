import type { IConfig } from '../src/types'

export const mockConfig = (): IConfig => {
  return {
    text: 'mock text',
    fillStyle: 'mock fill style',
    strokeStyle: 'mock stroke style',
    gravityX: -1,
    gravityY: 1,
  }
}
