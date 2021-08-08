// https://umipla.com/
// @ts-ignore
import slashSoundURL1 from '../assets/se_sword_hit9.mp3'
// @ts-ignore
import slashSoundURL2 from '../assets/se_sword_hit2.mp3'

export class AppAudio {
  private slashSound1: HTMLAudioElement
  private slashSound2: HTMLAudioElement

  constructor() {
    this.slashSound1 = new Audio(slashSoundURL1)
    this.slashSound1.load()
    this.slashSound2 = new Audio(slashSoundURL2)
    this.slashSound2.load()
  }

  public playSlash(seed: number): void {
    this.slashSound1.pause()
    this.slashSound1.currentTime = 0
    this.slashSound2.pause()
    this.slashSound2.currentTime = 0

    if (seed < 0.5) {
      this.slashSound1.play()
    } else {
      this.slashSound2.play()
    }
  }
}
