import { html, render as litRender } from 'lit-html'
import App from './app'

function render (h: any, component: HTMLElement): any {
  return litRender(h, component.shadowRoot || component.attachShadow({ mode: 'open' }))
}

class OkadaPhy extends HTMLElement {
  static get observedAttributes () { return ['name'] }

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
      <div>
        <input
          type="file" accept="image/svg"
          @change="${(e: Event) => this.importFromSVG(e)}"
        />
        <button @click="${() => this.toggleRun()}">
          ${this.isRunning() ? 'stop' : 'run'}
        </button>
      </div>
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
  }

  private isRunning () {
    if (!this.app) return
    return this.app.isRunning()
  }

  private toggleRun () {
    if (!this.app) return
    if (this.app.isRunning()) {
      this.app.stop()
    } else {
      this.app.run()
    }
    render(this.html(), this)
  }

  private importFromSVG (e: Event) {
    const file = (e.target as HTMLInputElement).files
    if (!file || file.length === 0) return

    const reader = new FileReader()
    reader.readAsText(file[0])
    reader.onload = () => {
      if (!this.shadowRoot) return
      if (this.app) this.app.dispose()
      const canvas = this.shadowRoot.getElementById('canvas')
      if (!canvas) return
      this.app = new App({ canvas: canvas as HTMLCanvasElement })
      this.app.importFromSVG(reader.result as string)
      this.app.run()
      render(this.html(), this)
    }

  }
}
customElements.define('okada-phy', OkadaPhy)
