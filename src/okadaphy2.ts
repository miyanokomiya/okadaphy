import { html, render as litRender } from 'lit-html'
import App from './app'

function render (h: any, component: HTMLElement): any {
  return litRender(h, component.shadowRoot || component.attachShadow({ mode: 'open' }))
}

class OkadaPhy2 extends HTMLElement {
  private app: App | null
  private width: number
  private height: number
  private text: string

  constructor () {
    super()

    this.app = null
    this.width = 300
    this.height = 300
    this.text = '岡田を\n切る技術'
  }

  public html () {
    return html`
      <div>
        <canvas id="canvas"
          width="${this.width}" height="${this.height}"
          style="border: 1px solid gray;"
        ></canvas>
        <textarea
          cols="30"
          rows="3"
          @input=${(e: any) => { this. text = e.target.value }}
        >${this.text}</textarea>
        <button
          type="button"
          @click="${() => this.importText()}"
        >RUN</button>
      </div>`
  }

  public connectedCallback () {
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

  private importText () {
    if (!this.app) return
    this.app.clear()
    this.app.importFromString(this.text)
    this.app.run()
  }
}
customElements.define('okada-phy2', OkadaPhy2)
