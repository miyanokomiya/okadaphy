import App from './app'

const app = new App({ canvas: document.getElementById('canvas') as HTMLCanvasElement })

const fileInput = document.getElementById('input') as HTMLInputElement
fileInput.onchange = (e) => {
  const file = (e.target as HTMLInputElement).files
  if (!file || file.length === 0) return

  const reader = new FileReader()
  reader.readAsText(file[0])
  reader.onload = () => app.importFromSVG(reader.result as string)
}

const runButton = document.getElementById('run') as HTMLButtonElement
runButton.onclick = () => {
  if (app.isRunning()) {
    app.stop()
    runButton.textContent = 'run'
  } else {
    app.run()
    runButton.textContent = 'stop'
  }
}
