import { html, render as litRender } from 'lit-html'
import App from './app'

function render(h: any, component: HTMLElement): any {
  return litRender(h, component.shadowRoot || component.attachShadow({ mode: 'open' }))
}

class OkadaPhy extends HTMLElement {
  private app: App | null
  private width: number
  private height: number
  private text: string
  private fillStyle: string
  private strokeStyle: string
  private gravityX: number
  private gravityY: number

  constructor() {
    super()

    this.app = null
    this.width = 300
    this.height = 300
    this.text = '岡田を\n切る技術'
    this.fillStyle = '#000'
    this.strokeStyle = '#FFFF00'
    this.gravityX = 0
    this.gravityY = 0
  }

  public html() {
    return html`
      <div>
        <canvas
          id="canvas"
          width="${this.width}"
          height="${this.height}"
          style="border: 1px solid gray;"
        ></canvas>
        <div>
          <textarea
            cols="30"
            rows="3"
            @input="${(e: any) => {
              this.text = e.target.value
            }}"
          >
${this.text}</textarea
          >
          <br />
          <button type="button" @click="${() => this.importText()}">RUN</button>
          <br />
          <br />
          面:
          <input
            type="color"
            value="${this.fillStyle}"
            @input="${(e: any) => {
              this.fillStyle = e.target.value
            }}"
          />
          <br />
          線:
          <input
            type="color"
            value="${this.strokeStyle}"
            @input="${(e: any) => {
              this.strokeStyle = e.target.value
            }}"
          />
          <br />
          重力x:
          <input
            min="-0.05"
            max="0.05"
            step="0.0001"
            type="range"
            value="${this.gravityX}"
            @input="${(e: any) => {
              this.gravityX = e.target.value
            }}"
          />
          <br />
          重力y:
          <input
            min="-0.05"
            max="0.05"
            step="0.0001"
            type="range"
            value="${this.gravityY}"
            @input="${(e: any) => {
              this.gravityY = e.target.value
            }}"
          />
        </div>
      </div>
    `
  }

  public connectedCallback() {
    const width = this.getAttribute('width')
    const height = this.getAttribute('height')
    if (width) this.width = parseInt(width, 10)
    if (height) this.height = parseInt(height, 10)
    render(this.html(), this)
    if (!this.shadowRoot) return
    const canvas = this.shadowRoot.getElementById('canvas')
    if (!canvas) return
    this.app = new App({ canvas: canvas as HTMLCanvasElement })
    this.importText()
  }

  private importText() {
    if (!this.app) return
    this.app.clear()
    this.app.setGravity(this.gravityX, this.gravityY)
    this.app.importFromString({
      fillStyle: this.fillStyle,
      strokeStyle: this.strokeStyle,
      text: this.text,
    })
    this.app.run()
  }
}
customElements.define('okada-phy', OkadaPhy)
