import { Font, load } from 'opentype.js'
import okageo, { IVec2, ISvgPath, ISvgStyle } from 'okageo'

let _font: Font | null
const fontURL = 'https://fonts.gstatic.com/ea/notosansjapanese/v6/NotoSansJP-Medium.otf'

export function loadFont(): Promise<Font> {
  return new Promise((resolve, reject) => {
    if (_font) resolve(_font)

    load(fontURL, (err, font) => {
      if (!font || err) {
        return reject(new Error('Font could not be loaded: ' + err))
      }
      return resolve(font)
    })
  })
}

export async function parseFont(text: string, style: ISvgStyle): Promise<ISvgPath[]> {
  const font = await loadFont()
  const lines = text.split(/\n|\r\n/)
  const size = 72
  let pathList: IVec2[][] = []
  lines.forEach((line, i) => {
    pathList = pathList.concat(
      okageo.svg
        .parseOpenPath(font.getPath(line, 0, size * 1.1 * i, size))
        .map((info) => okageo.geo.omitSamePoint(info.d)),
    )
  })

  return okageo.geo.getIncludedPolygonGroups(pathList).map((group) => {
    const [d, ...included] = group
    return { d, included, style }
  })
}
