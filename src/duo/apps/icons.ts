import type { PhoneApp } from './types'
import './icons.css'

// Original vectors, visually checked against Apple's current app artwork:
// https://www.apple.com/apps/ and https://support.apple.com/guide/iphone/welcome/ios
// These deliberately omit the glass rendering, not the apps' identifying artwork.
const SVG_NS = 'http://www.w3.org/2000/svg'
type Attrs = Record<string, string | number>

function svgEl<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Attrs = {}): SVGElementTagNameMap[K] {
  const node = document.createElementNS(SVG_NS, tag)
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value))
  return node
}

const path = (d: string, attrs: Attrs = {}) => svgEl('path', { d, ...attrs })
const circle = (cx: number, cy: number, r: number, attrs: Attrs = {}) => svgEl('circle', { cx, cy, r, ...attrs })
const rect = (x: number, y: number, width: number, height: number, attrs: Attrs = {}) =>
  svgEl('rect', { x, y, width, height, ...attrs })
const line = (x1: number, y1: number, x2: number, y2: number, attrs: Attrs = {}) =>
  svgEl('line', { x1, y1, x2, y2, ...attrs })
const text = (x: number, y: number, value: string, attrs: Attrs = {}) => {
  const element = svgEl('text', {
    x, y, fill: '#111', 'font-family': '-apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif',
    'text-anchor': 'middle', ...attrs,
  })
  element.textContent = value
  return element
}
const white = '#fff'
const stroke = (color = white, width = 4): Attrs => ({
  fill: 'none', stroke: color, 'stroke-width': width, 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
})
const green = 'linear-gradient(#51ee60, #08bd2b)'
const blue = 'linear-gradient(#1479f8, #10b6f2)'
const black = '#08090b'

interface IconCtx {
  defs: SVGDefsElement
  gid: (name: string) => string
}

interface IconDef {
  background: string
  light?: boolean
  build: (ctx: IconCtx) => SVGElement[]
}

function gradient(ctx: IconCtx, name: string, colors: string[], attrs: Attrs = {}): string {
  const node = svgEl('linearGradient', { id: ctx.gid(name), x1: 0, y1: 0, x2: 0, y2: 1, ...attrs })
  colors.forEach((color, index) => node.append(svgEl('stop', {
    offset: index / (colors.length - 1), 'stop-color': color,
  })))
  ctx.defs.append(node)
  return `url(#${ctx.gid(name)})`
}

function ticks(cx: number, cy: number, radius: number, count: number, color: string, majorEvery = 5): SVGElement[] {
  return Array.from({ length: count }, (_, index) => {
    const angle = index * 2 * Math.PI / count
    const major = index % majorEvery === 0
    const inner = radius - (major ? 5 : 2.5)
    return line(cx + Math.sin(angle) * inner, cy - Math.cos(angle) * inner,
      cx + Math.sin(angle) * radius, cy - Math.cos(angle) * radius,
      { stroke: color, 'stroke-width': major ? 1.4 : 0.7 })
  })
}

function gear(cx: number, cy: number, radius: number, count: number, color: string): SVGElement[] {
  return [
    ...Array.from({ length: count }, (_, index) => rect(cx - 1.7, cy - radius - 2, 3.4, 5, {
      rx: 0.7, fill: color, transform: `rotate(${index * 360 / count} ${cx} ${cy})`,
    })),
    circle(cx, cy, radius - 2, { fill: 'none', stroke: color, 'stroke-width': 5 }),
  ]
}

function ring(radius: number, width: number, color: string, progress: number): SVGElement[] {
  const circumference = Math.PI * 2 * radius
  return [
    circle(50, 50, radius, { fill: 'none', stroke: color, 'stroke-width': width, opacity: 0.22 }),
    circle(50, 50, radius, {
      ...stroke(color, width), 'stroke-dasharray': `${circumference * progress} ${circumference}`,
      transform: 'rotate(-90 50 50)',
    }),
  ]
}

const ICONS: Record<string, IconDef> = {
  phone: {
    background: green,
    build: () => [
      path('M27 19c-2-1-4 0-6 2l-4 6c-3 5 0 15 5 24 8 14 19 24 34 31 9 4 16 4 20 0l6-7c2-2 2-4 0-6L68 59c-2-1-4-1-6 1l-5 5c-1 1-3 1-5 0-8-4-15-11-19-18-1-2-1-4 0-5l5-5c2-2 2-4 1-6z', { fill: white }),
    ],
  },
  contacts: {
    background: '#d7d3cb', light: true,
    build: () => [
      rect(86, 24, 10, 23, { rx: 2, fill: '#37b9e9' }),
      rect(86, 48, 10, 22, { rx: 2, fill: '#f6a02a' }),
      rect(86, 71, 10, 15, { rx: 2, fill: '#66bd59' }),
      rect(7, 5, 81, 90, { rx: 16, fill: '#dcd9d2', stroke: '#bebbb4', 'stroke-width': 1.5 }),
      circle(46, 50, 29, { fill: 'none', stroke: '#afaba2', 'stroke-width': 2.4 }),
      svgEl('ellipse', { cx: 46, cy: 42, rx: 10.5, ry: 13, fill: '#aaa69e' }),
      path('M23 68c3-11 13-15 23-15s20 4 23 15c-12 14-34 14-46 0', { fill: '#aaa69e' }),
    ],
  },
  facetime: {
    background: green,
    build: () => [
      rect(15, 30, 49, 40, { rx: 10, fill: white }),
      path('M70 40 83 31q4-3 4 2v34q0 5-4 2L70 60z', { fill: white }),
    ],
  },
  messages: {
    background: green,
    build: () => [
      path('M50 18c-21 0-37 14-37 31 0 11 6 20 16 26-1 5-4 8-8 11 9 0 15-3 20-7 3 1 6 1 9 1 21 0 37-14 37-31S71 18 50 18', { fill: white }),
    ],
  },
  mail: {
    background: blue,
    build: () => [
      rect(13, 28, 74, 49, { rx: 6, fill: white }),
      path('m14 31 33 26q3 2 6 0l33-26M14 74l26-24m20 0 26 24', stroke('#159ef5', 2.2)),
    ],
  },
  safari: {
    background: '#fafafa', light: true,
    build: ctx => [
      circle(50, 50, 44, { fill: gradient(ctx, 'ocean', ['#16cbfa', '#0873e9']), stroke: '#d3d7db', 'stroke-width': 1 }),
      ...ticks(50, 50, 40, 60, '#e2f8ff'),
      path('m25 76 18-32 33-19-19 33z', { fill: '#005fbd', opacity: 0.35 }),
      path('m25 75 18-32 14 14z', { fill: white }),
      path('m75 25-18 32-14-14z', { fill: '#ff4438' }),
      path('m75 25-25 25-7-7z', { fill: '#ff8068' }),
      path('m25 75 25-25 7 7z', { fill: '#d4e5ec' }),
    ],
  },
  maps: {
    background: '#e8e6e0', light: true,
    build: () => [
      path('M0 0h46v46H0zM67 0h33v42L67 25z', { fill: '#83db76' }),
      path('M0 58h25v42H0z', { fill: '#e7a8e3' }),
      path('M68 51 100 69v31H68z', { fill: '#66cd65' }),
      path('M29 0h26v100H29z', { fill: white }),
      path('M33 0h18v100H33z', { fill: '#33a7f6' }),
      path('m57 0 4 27q1 7 9 12l30 16v21L63 54q-12-7-12-20L48 0z', { fill: white }),
      path('m88 0q0 17 12 22', { ...stroke(white, 7) }),
      path('m0 17 27 19M52 82l30 18', { ...stroke(white, 12) }),
      path('m56 91 14 9H54z', { fill: '#ffd451' }),
      circle(42, 66, 23, { fill: '#0787f9', stroke: white, 'stroke-width': 4 }),
      path('m42 48 12 33-12-8-12 8z', { fill: white }),
    ],
  },
  weather: {
    background: blue,
    build: ctx => [
      circle(66, 35, 17, { fill: gradient(ctx, 'sun', ['#ffe963', '#ffd01b']) }),
      path('M28 75c-11 0-18-7-18-16 0-8 5-14 12-16 0-12 8-20 18-20 10 0 17 7 19 16 10-2 19 6 19 16 7 0 12 5 12 10 0 6-5 10-12 10z', {
        fill: gradient(ctx, 'cloud', [white, '#dbeef9']),
      }),
    ],
  },
  calendar: {
    background: white, light: true,
    build: () => {
      const date = new Date()
      return [
        text(50, 27, date.toLocaleDateString('en-US', { weekday: 'short' }), {
          fill: '#ee3b37', 'font-size': 16, 'font-weight': 500,
        }),
        text(50, 83, String(date.getDate()), { 'font-size': 59, 'font-weight': 300, 'letter-spacing': -3 }),
      ]
    },
  },
  reminders: {
    background: white, light: true,
    build: () => [28, 50, 72].flatMap((y, index) => {
      const color = ['#158aff', '#ff514a', '#ff9e0b'][index]!
      return [
        circle(23, y, 7.5, { ...stroke(color, 1.4) }),
        circle(23, y, 5.2, { fill: color }),
        line(39, y, 85, y, { stroke: '#c9c9ce', 'stroke-width': 2 }),
      ]
    }),
  },
  clock: {
    background: white, light: true,
    build: () => [
      circle(50, 50, 44, { fill: white }),
      ...ticks(50, 50, 41, 60, '#6d6d70'),
      ...[3, 6, 9, 12].map(hour => {
        const angle = hour * Math.PI / 6
        return text(50 + Math.sin(angle) * 30, 54 - Math.cos(angle) * 30, String(hour), {
          'font-size': 11, 'font-weight': 500,
        })
      }),
      line(50, 50, 31, 39, stroke('#121214', 3.5)),
      line(50, 50, 73, 37, stroke('#121214', 2.4)),
      line(50, 42, 50, 84, stroke('#ff8e24', 1.2)),
      circle(50, 50, 3.1, { fill: '#111' }),
      circle(50, 50, 1.6, { fill: '#ff8e24' }),
    ],
  },
  camera: {
    background: 'linear-gradient(#ececee, #a6a7ab)', light: true,
    build: ctx => {
      const lens = svgEl('radialGradient', { id: ctx.gid('lens'), cx: '38%', cy: '32%', r: '68%' })
      const stops: Array<[string, string]> = [
        ['0%', '#5da5dc'], ['28%', '#172c44'], ['65%', '#080e1b'], ['87%', '#284261'], ['100%', '#101621'],
      ]
      stops.forEach(([offset, color]) => lens.append(svgEl('stop', { offset, 'stop-color': color })))
      ctx.defs.append(lens)
      return [
        circle(50, 50, 41, { fill: '#353b44', stroke: '#eceef1', 'stroke-width': 1.5 }),
        circle(50, 50, 37, { fill: '#090d12', stroke: '#8a949e', 'stroke-width': 1.3 }),
        circle(50, 50, 33, { fill: `url(#${ctx.gid('lens')})`, stroke: '#465566', 'stroke-width': 1 }),
        path('M28 54a24 24 0 0 1 19-29', { ...stroke('#3991d8', 2), opacity: 0.8 }),
        path('M72 46a23 23 0 0 1-22 28', { ...stroke('#92c4e9', 2.5), opacity: 0.65 }),
        svgEl('ellipse', { cx: 38, cy: 34, rx: 7, ry: 10, fill: '#bdeaff', transform: 'rotate(35 38 34)', opacity: 0.85 }),
        svgEl('ellipse', { cx: 40, cy: 33, rx: 4, ry: 7, fill: white, transform: 'rotate(35 40 33)' }),
        svgEl('ellipse', { cx: 62, cy: 63, rx: 4, ry: 8, fill: '#528bd0', transform: 'rotate(35 62 63)', opacity: 0.65 }),
      ]
    },
  },
  photos: {
    background: white, light: true,
    build: () => [
      ...['#ffb800', '#f5d400', '#77c445', '#27b99e', '#459cdc', '#786bb4', '#e46aa5', '#ff7758']
      .map((color, index) => svgEl('ellipse', {
        cx: 50, cy: 30, rx: 13.5, ry: 23, fill: color, opacity: 0.65,
        transform: `rotate(${index * 45} 50 50)`, style: 'mix-blend-mode:multiply',
      })),
      circle(50, 50, 3.5, { fill: white, opacity: 0.9 }),
    ],
  },
  music: {
    background: 'linear-gradient(#ff5574, #fc183d)',
    build: () => [
      path('M42 29 75 22q3-1 3 3v43c0 7-7 12-14 11-6-1-7-7-3-11 3-3 7-3 11-4V39l-25 5v31c0 7-7 12-14 11-6-1-8-7-3-11 3-3 7-4 11-4V32q0-2 1-3', { fill: white }),
    ],
  },
  podcasts: {
    background: 'linear-gradient(#dc73f4, #8723c6)',
    build: () => [
      path('M35 79a34 34 0 1 1 30 0M36 65a23 23 0 1 1 28 0', stroke(white, 4.5)),
      circle(50, 40, 9, { fill: white }),
      path('M40 58q0-7 10-7t10 7l-4 24q-1 5-6 5t-6-5z', { fill: white }),
    ],
  },
  tv: {
    background: '#151517',
    build: () => [
      path('M32 36c-4-1-8-4-12-1-10 5-7 21-1 28 3 4 5 5 9 3 3-1 4-1 7 0 4 2 7-1 10-7-6-3-8-12-1-17-3-5-7-7-12-6m-2-3c-1-7 5-12 11-13 0 6-4 12-11 13', { fill: white }),
      path('M55 32v27q0 8 9 7M50 42h15m4 0 10 23 10-23', stroke(white, 4.6)),
    ],
  },
  books: {
    background: 'linear-gradient(#ffb000, #ff8300)',
    build: () => [
      path('M47 29c-10-7-22-7-32-1v47c11-6 22-6 32 0zM53 29c10-7 22-7 32-1v47c-11-6-22-6-32 0z', { fill: white }),
    ],
  },
  games: {
    background: 'linear-gradient(#ff7367, #ff1838)',
    build: ctx => [
      path('M36 47c-12-2-20 8-21 17l20-2m15 3-2 20c10-2 18-10 17-21', { fill: '#ffc7ba' }),
      path('M30 67q-12 4-14 16 10 1 18-8l-2 10q13-7 11-18z', { fill: white }),
      path('M32 58c7-21 27-40 51-41-1 25-18 46-39 53z', { fill: gradient(ctx, 'rocket', [white, '#ffd1c8']) }),
      path('M64 22q10-4 19-5-1 9-5 18z', { fill: '#ffe8df' }),
      circle(64, 37, 7, { fill: '#ff605d' }),
      path('m45 58 13-8-8 15-12 8z', { fill: '#ff8e84' }),
    ],
  },
  health: {
    background: white, light: true,
    build: ctx => [
      path('M59 30c-6-12-25-8-25 7 0 12 14 23 25 31 11-8 25-19 25-31 0-15-19-19-25-7', {
        fill: gradient(ctx, 'heart', ['#ff599b', '#ff2132']),
      }),
    ],
  },
  fitness: {
    background: black,
    build: () => [
      ...ring(36, 9, '#ff245d', 0.93),
      ...ring(25, 9, '#b4fa00', 0.87),
      ...ring(14, 9, '#00e4df', 0.82),
      path('m48 11 4 3-4 3m0 5 4 3-4 3m0 5 4 3-4 3', stroke('#17230c', 1.6)),
    ],
  },
  watch: {
    background: black,
    build: () => [
      path('M35 24 38 9h22l3 15M35 76l3 15h22l3-15', { fill: white }),
      rect(28, 21, 42, 58, { rx: 13, ...stroke(white, 4.8) }),
      rect(72, 36, 5, 12, { rx: 2, fill: white }),
      line(73, 54, 73, 63, stroke(white, 2)),
    ],
  },
  wallet: {
    background: '#191a1b',
    build: () => [
      rect(14, 22, 72, 58, { rx: 8, fill: '#d8d7cc' }),
      rect(18, 26, 64, 30, { rx: 3, fill: '#43b4d3' }),
      rect(18, 32, 64, 28, { rx: 2, fill: '#f4b345' }),
      rect(18, 38, 64, 26, { rx: 2, fill: '#77b66a' }),
      rect(18, 44, 64, 22, { rx: 2, fill: '#f57859' }),
      path('M14 49h24q2 10 12 10t12-10h24v24q0 7-7 7H21q-7 0-7-7z', { fill: '#deddd3' }),
    ],
  },
  'find-my': {
    background: '#f7f8f7', light: true,
    build: ctx => [
      circle(50, 50, 43, { fill: gradient(ctx, 'radar', ['#12ed78', '#08b846']) }),
      circle(50, 50, 29, { ...stroke('#d3ffe2', 1.2), opacity: 0.65 }),
      path('M50 50 29 12a43 43 0 0 1 42 0z', { fill: gradient(ctx, 'beam', ['#04c6fa', '#0082ef']) }),
      circle(50, 50, 12, { fill: '#128ff4', stroke: white, 'stroke-width': 3 }),
      circle(50, 50, 41, { ...stroke('#7be8ad', 1) }),
    ],
  },
  home: {
    background: white, light: true,
    build: ctx => [
      path('m11 43 39-32 39 32h-8v42H19V43z', { fill: '#ff8b06' }),
      path('m21 44 29-24 29 24v34H21z', { fill: gradient(ctx, 'house', ['#ffd45a', '#ffb51d']) }),
      path('m31 46 19-16 19 16v22H31z', { fill: '#ffe18a' }),
      rect(44, 49, 12, 19, { fill: '#fff0b3' }),
    ],
  },
  'itunes-store': {
    background: 'linear-gradient(#ee4ec9, #ca38e6)',
    build: () => [
      path('m50 15 9 26h28L65 58l9 27-24-17-24 17 9-27-22-17h28z', { fill: white }),
      path('m50 15 9 26-9 13-9-13zm0 39 24 31-9-27z', { fill: '#f5d7fa' }),
    ],
  },
  files: {
    background: white, light: true,
    build: ctx => [
      path('M15 29q0-6 6-6h20l7 6h31q6 0 6 6v38q0 6-6 6H21q-6 0-6-6z', { fill: '#00bbef' }),
      rect(16, 33, 68, 6, { fill: '#e4faff' }),
      rect(15, 38, 70, 42, { rx: 5, fill: gradient(ctx, 'folder', ['#12c5f4', '#087aff']) }),
    ],
  },
  freeform: {
    background: 'linear-gradient(#242d33, #080d11)',
    build: ctx => [
      rect(21, 15, 62, 61, { rx: 15, fill: gradient(ctx, 'back', ['#64afc1', '#255873']) }),
      rect(15, 38, 62, 48, { rx: 17, fill: '#25657b', opacity: 0.85 }),
      path('M20 59c6-20 13-29 18-25 6 5-5 24-1 26 5 3 10-26 17-23 7 3-4 23 2 24 5 1 9-16 15-17h15', stroke('#a0edff', 4.5)),
    ],
  },
  journal: {
    background: '#23243c',
    build: ctx => [
      path('M49 42C39 28 25 20 16 20v33c11 0 24 7 33 18z', { fill: gradient(ctx, 'left', ['#a486bc', '#8287da']) }),
      path('M51 42c10-14 24-22 33-22v33c-11 0-24 7-33 18z', { fill: gradient(ctx, 'right', ['#ffd0b8', '#ff7e8d']) }),
      path('M25 57c10 2 18 7 24 14-6 11-15 15-24 14z', { fill: '#94a4fa' }),
      path('M75 57c-10 2-18 7-24 14 6 11 15 15 24 14z', { fill: '#f77878' }),
    ],
  },
  'voice-memos': {
    background: '#070708',
    build: () => [
      line(9, 50, 91, 50, { stroke: '#88888c', 'stroke-width': 0.7 }),
      ...[4, 9, 19, 29, 48, 34, 68, 43, 28, 14, 8, 5, 4, 3, 2].map((height, index) =>
        line(17 + index * 4.6, 50 - height / 2, 17 + index * 4.6, 50 + height / 2,
          stroke(index < 8 ? '#f64a3c' : '#ceced1', 2.1))),
      line(53, 16, 53, 85, { stroke: '#2784bb', 'stroke-width': 1 }),
      circle(53, 85, 2, { fill: '#2784bb' }),
    ],
  },
  'discovery-app-store': {
    background: 'linear-gradient(#12c5ed, #087afb)',
    build: () => [
      path('m38 24 9 15m9-15L28 75M60 43l19 32M20 59h39m13 0h9', stroke(white, 8)),
    ],
  },
  'discovery-shortcuts': {
    background: 'linear-gradient(#3a3c70, #171849)',
    build: ctx => [
      path('m44 40-23 18q-5 4 0 9l23 20q6 5 12 0l23-20q5-5 0-9L56 40q-6-5-12 0', {
        fill: gradient(ctx, 'lower', ['#118cf6', '#10dbe4', '#51c9bd']),
      }),
      path('m44 14-23 18q-5 4 0 9l23 20q6 5 12 0l23-20q5-5 0-9L56 14q-6-5-12 0', {
        fill: gradient(ctx, 'upper', ['#ec63bc', '#e94588', '#7363be']),
      }),
    ],
  },
  'discovery-translate': {
    background: '#11191c',
    build: () => [
      circle(50, 50, 36, stroke('#76a9b1', 1.4)),
      svgEl('ellipse', { cx: 50, cy: 50, rx: 18, ry: 36, ...stroke('#76a9b1', 1.4) }),
      path('M16 40h68M16 62h68M50 14v72', stroke('#76a9b1', 1.2)),
      path('M13 18h32q5 0 5 5v21q0 5-5 5H30l-9 8v-8h-8q-5 0-5-5V23q0-5 5-5', { fill: white }),
      path('M55 53h32q5 0 5 5v21q0 5-5 5h-8v8l-9-8H55q-5 0-5-5V58q0-5 5-5', { fill: '#36bad4' }),
      path('m21 41 8-17 8 17m-13-5h10', stroke('#192125', 2.7)),
      path('M64 62h15m-7-4v4m5 1q-1 9-14 15m3-13q3 8 14 12', stroke(white, 2)),
    ],
  },
  'discovery-tips': {
    background: 'linear-gradient(#ffc500, #ffab00)',
    build: () => [
      path('M50 15c-16 0-26 11-26 25 0 11 6 17 12 24 2 3 2 6 2 10h24c0-4 0-7 2-10 6-7 12-13 12-24 0-14-10-25-26-25', { fill: white }),
      path('M50 72V48M41 48h18', stroke('#ffba00', 3.3)),
      path('M40 79h20m-18 5h16m-12 5h8', stroke(white, 2.7)),
    ],
  },
  compass: {
    background: '#111213',
    build: () => [
      ...ticks(50, 50, 43, 72, '#bec0c3', 6),
      ...[['N', 50, 28], ['E', 74, 54], ['S', 50, 80], ['W', 26, 54]].map(([label, x, y]) =>
        text(Number(x), Number(y), String(label), { fill: white, 'font-size': 10, 'font-weight': 500 })),
      path('M50 33v34M33 50h34', stroke('#85868a', 1)),
      path('m50 8-4 7h8z', { fill: '#ff5546', transform: 'rotate(45 50 50)' }),
      circle(50, 50, 2, { fill: '#ccc' }),
    ],
  },
  measure: {
    background: '#202122',
    build: () => [
      ...Array.from({ length: 15 }, (_, index) => [
        line(7 + index * 6, 23, 7 + index * 6, index % 5 === 0 ? 39 : index % 2 === 0 ? 34 : 29, { stroke: '#dadadd', 'stroke-width': 1.1 }),
        line(7 + index * 6, 78, 7 + index * 6, index % 5 === 0 ? 62 : index % 2 === 0 ? 67 : 72, { stroke: '#dadadd', 'stroke-width': 1.1 }),
      ]).flat(),
      line(9, 51, 91, 51, { stroke: '#f4cd20', 'stroke-width': 1.2, 'stroke-dasharray': '1 2' }),
      circle(9, 51, 2.5, { fill: '#ffe022' }),
      circle(91, 51, 2.5, { fill: '#ffe022' }),
    ],
  },
  stocks: {
    background: '#101113',
    build: () => [
      ...[16, 32, 48, 64, 80].map(x => line(x, 0, x, 100, { stroke: '#3a3a3d', 'stroke-width': 1.3 })),
      path('M0 58 8 62l8-7 7 7 8-3 7-15 6 20 7-3 7-14 7 2 7-20 6 27 8-17 7-3 7 2', stroke(white, 2.1)),
      line(72, 0, 72, 100, { stroke: '#14c4eb', 'stroke-width': 1.4 }),
      circle(72, 29, 4, { fill: '#24ccee' }),
    ],
  },
  news: {
    background: white, light: true,
    build: ctx => [
      path('M23 20h14l40 47v13H64L23 32zM23 46l29 34H29q-6 0-6-6zm25-26h23q6 0 6 6v28z', {
        fill: gradient(ctx, 'news', ['#ff426c', '#fb2047']),
      }),
    ],
  },
  passwords: {
    background: white, light: true,
    build: () => [
      path('M34 16c-22-1-27 30-10 38v26l10 7 6-6-6-6 6-6-6-6V53c17-8 16-34 0-37', { fill: '#ffd545' }),
      path('M45 16c-22-1-27 30-10 38v26l10 7 6-6-6-6 6-6-6-6V53c17-8 16-34 0-37', { fill: '#7fc766', stroke: white, 'stroke-width': 2.5 }),
      path('M62 14c-22 0-28 29-11 40v26l10 8 9-9-7-7 7-7-7-7v-4c21-4 22-40-1-40', { fill: '#37b6f5', stroke: white, 'stroke-width': 2.5 }),
      circle(62, 29, 5, { fill: white }),
    ],
  },
  settings: {
    background: 'linear-gradient(#d9dadc, #999a9f)', light: true,
    build: () => [
      circle(50, 50, 43, { fill: '#66686b', stroke: '#e5e5e8', 'stroke-width': 2 }),
      ...gear(50, 50, 37, 36, '#c9cace'),
      circle(50, 50, 30, { fill: '#333538', stroke: '#9c9ea2', 'stroke-width': 1.5 }),
      ...gear(50, 50, 25, 24, '#acadb1'),
      circle(50, 50, 20, { fill: '#53555a', stroke: '#e2e2e5', 'stroke-width': 3.5 }),
      path('M49 47 39 32m14 17 17-1M48 54 39 69', stroke('#dedee1', 5.5)),
      circle(50, 50, 5.5, { fill: '#505258', stroke: '#dedee1', 'stroke-width': 2.5 }),
    ],
  },
  magnifier: {
    background: '#161718',
    build: () => [
      circle(44, 42, 25, stroke(white, 4)),
      line(63, 61, 84, 82, stroke(white, 7)),
      path('M32 42h24M44 30v24', stroke('#ffdb30', 3.6)),
    ],
  },
  calculator: {
    background: '#b9babb', light: true,
    build: () => [
      rect(23, 10, 54, 80, { rx: 8, fill: '#222325' }),
      rect(28, 16, 44, 18, { rx: 3, fill: '#5c5d5e' }),
      ...[45, 61, 77].flatMap(y => [
        circle(33, y, 5.5, { fill: '#d6d6d5' }),
        circle(49, y, 5.5, { fill: '#d6d6d5' }),
        circle(65, y, 5.5, { fill: '#ffa20a' }),
      ]),
      rect(28, 72, 26, 11, { rx: 5.5, fill: '#d6d6d5' }),
      path('M62 44h6m-6 17h6m-6 14h6m-6 4h6', stroke('#8c5100', 1.1)),
    ],
  },
  notes: {
    background: white, light: true,
    build: ctx => [
      rect(0, 0, 100, 27, { fill: gradient(ctx, 'header', ['#ffe568', '#ffca09']) }),
      line(0, 29, 100, 29, { stroke: '#c7c7c8', 'stroke-width': 1, 'stroke-dasharray': '1 2' }),
      ...[51, 72, 93].map(y => line(0, y, 100, y, { stroke: '#d3d3d6', 'stroke-width': 1.2 })),
    ],
  },
}

function fallbackIcon(app: PhoneApp): IconDef {
  const color = /^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i.test(app.color) ? app.color : '#707a89'
  return {
    background: color,
    build: () => [
      ...[[27, 27], [55, 27], [27, 55], [55, 55]].map(([x, y]) =>
        rect(x!, y!, 18, 18, { rx: 5, fill: white, opacity: 0.9 })),
    ],
  }
}

let instanceCounter = 0

/** Decorative artwork; the launcher owns the accessible app name. */
export function createAppIcon(app: PhoneApp): HTMLElement {
  const def = Object.hasOwn(ICONS, app.id) ? ICONS[app.id]! : fallbackIcon(app)
  const uid = `dicon-${++instanceCounter}`
  const gid = (name: string) => `${uid}-${name}`
  const root = document.createElement('span')
  root.className = 'app-icon'
  root.dataset.appIcon = app.id
  if (def.light) root.dataset.tone = 'light'
  root.setAttribute('aria-hidden', 'true')
  root.style.background = def.background

  const glyphHost = document.createElement('span')
  glyphHost.className = 'app-icon-glyph'
  const defs = svgEl('defs')
  const glyphs = def.build({ defs, gid })
  const svg = svgEl('svg', { viewBox: '0 0 100 100', width: '100%', height: '100%', focusable: 'false' })
  svg.append(defs, ...glyphs)
  glyphHost.append(svg)
  root.append(glyphHost)
  return root
}
