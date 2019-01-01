import App from './app'

const fileInput = document.getElementById('input') as HTMLInputElement
const runButton = document.getElementById('run') as HTMLButtonElement
const canvas = document.getElementById('canvas') as HTMLCanvasElement
let app: App | null = null

fileInput.onchange = (e) => {
  const file = (e.target as HTMLInputElement).files
  if (!file || file.length === 0) return

  const reader = new FileReader()
  reader.readAsText(file[0])
  reader.onload = () => {
    if (app) app.dispose()
    app = new App({ canvas })
    app.importFromSVG(reader.result as string)
    app.run()
    runButton.textContent = 'stop'
  }
}

runButton.onclick = () => {
  if (!app) return
  if (app.isRunning()) {
    app.stop()
    runButton.textContent = 'run'
  } else {
    app.run()
    runButton.textContent = 'stop'
  }
}
