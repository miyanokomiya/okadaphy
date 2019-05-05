import { html, render as litRender } from 'lit-html'
import App from './app'

function render (h: any, component: HTMLElement): any {
  return litRender(h, component.shadowRoot || component.attachShadow({ mode: 'open' }))
}

class OkadaPhy2 extends HTMLElement {
  private app: App | null
  private width: number
  private height: number

  constructor () {
    super()

    this.app = null
    this.width = 300
    this.height = 300
  }

  public html () {
    return html`
      <canvas id="canvas"
        width="${this.width}" height="${this.height}"
        style="border: 1px solid gray;"
      />`
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
    this.app.importFromString('岡田を\n切る技術')
    this.app.run()
  }
}
customElements.define('okada-phy2', OkadaPhy2)
