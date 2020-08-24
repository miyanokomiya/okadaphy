import * as Comlink from 'comlink'

import { Common, Events, Engine, Runner, World } from 'matter-js'
import { getFrameBodies } from './frame'

const engine = Engine.create()
engine.world.gravity.x = 0
engine.world.gravity.y = 0
const runner = Runner.create({})

// skip to access window
Common.now = () => Date.now() - Common._nowStartTime
const exposed = {
  sayName(name: string) {
    return `hello ${name}`
  },
  init(size: { width: number; height: number }) {
    World.add(engine.world, getFrameBodies(size.width, size.height))
  },
  start() {
    Runner.start(runner, engine)
  },
  stop() {
    Runner.stop(runner)
  },
  bindAfterUpdate(cb: (t: number) => void) {
    Events.on(engine, 'afterUpdate', () => {
      cb(engine.timing.timestamp)
    })
  },
}

Comlink.expose(exposed)
