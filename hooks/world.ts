// O palco em pixels: céu pela hora real, sol/lua em arco, nuvens e chuva pelo clima,
// árvore, grama, passarinho de vez em quando, o personagem e as magias por cima.
import type { Grid } from './sprites'
import { hash, SPRITE_W, type Scene } from './stage'

export const STAGE_ROWS = 19 // linhas de texto (38 px): personagem + espaço do balão
const GROUND = 3

import type { Weather } from '../types'
export type { Weather }

const mix = (hex: string, to: string, t: number) =>
  '#' + [1, 3, 5].map(i => {
    const a = parseInt(hex.slice(i, i + 2), 16)
    const b = parseInt(to.slice(i, i + 2), 16)
    return Math.round(a + (b - a) * t).toString(16).padStart(2, '0')
  }).join('')

function mute(hex: string) {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number]
  const l = 0.299 * r + 0.587 * g + 0.114 * b
  const gray = '#' + [r, g, b].map(c => Math.round(c + (l - c) * 1).toString(16).padStart(2, '0')).join('')
  return mix(gray, '#1a1a1a', 0.58)
}

export const isRain = (w: Weather) => /chuv|garoa|tempest|trovo|aguaceiro/i.test(w.desc)
export const isCloudy = (w: Weather) => /nubl|encobert|neblin|nevoeiro/i.test(w.desc)

function sky(hour: number): [string, string, number] {
  // [topo, horizonte, quanto escurecer a paisagem]
  if (hour < 5 || hour >= 20) return ['#070b1f', '#1b2550', 0.55]
  if (hour < 7) return ['#2c3e7a', '#f2a46b', 0.25]
  if (hour < 17) return ['#4a90d9', '#b4e0f7', 0]
  return ['#3b3a78', '#f08a5d', 0.25]
}

const TREE = [
  '...LLGGG...', '..LGGGgGG..', '.LGGGGGGgG.', 'LGGgGGGGGGg', 'LGGGGGgGGGg',
  'GGGGGGGGGgg', '.GgGGGGGgg.', '..gGGGGgg..', '....TTt....', '....TTt....',
  '....TTt....', '...TTTtt...',
]
const TREE_PAL: Record<string, string> = { L: '#6fc25a', G: '#3f8f3a', g: '#2a6428', T: '#7a5230', t: '#5a3b20' }
const CLOUD = ['..WWWW...', '.WWWWWWW.', 'WWWWWWWWW']
const SUN = ['.YY.', 'YYYY', 'YYYY', '.YY.']
const BIRD = [['K.K', '.K.'], ['.K.', 'K.K']]

export function paint(
  n: number, W: number, sc: Scene, sprite: Grid, now: Date, weather: Weather,
): Grid {
  const H = STAGE_ROWS * 2
  const gy = H - GROUND // primeira linha de grama
  const g: Grid = Array.from({ length: H }, () => Array<string>(W).fill(''))
  const put = (x: number, y: number, c: string) => {
    if (x >= 0 && x < W && y >= 0 && y < H) g[y]![x] = c
  }
  const hour = now.getHours() + now.getMinutes() / 60
  const [top, bottom, night] = sky(hour)
  const wet = isRain(weather)
  const gray = wet || isCloudy(weather) ? 0.45 : 0
  const land = (c: string) => mix(c, '#000000', night)

  // céu em degradê
  for (let y = 0; y < gy; y++) {
    const c = mix(mix(top, bottom, y / gy), '#8a94a6', gray)
    for (let x = 0; x < W; x++) g[y]![x] = c
  }
  // estrelas
  if (night > 0.5 && !wet) {
    for (let i = 0; i < 14; i++) {
      const h = hash(i * 97 + 3)
      if ((n + i) % 6 !== 0) put(h % W, (h >> 8) % (gy - 8), (n + i) % 3 ? '#e8ecff' : '#8f9bd0')
    }
  }
  // sol de 6h às 18h, lua de 18h às 6h, em arco
  const isDay = hour >= 6 && hour < 18
  const arc = isDay ? (hour - 6) / 12 : ((hour - 18 + 24) % 24) / 12
  const ox = Math.round(1 + arc * (W - 6))
  const oy = Math.round(2 + (1 - Math.sin(Math.PI * arc)) * (gy - 18))
  SUN.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch === '.') return
    const c = isDay ? (x + y < 3 ? '#fff6c0' : '#ffd84a') : (x === 2 && y === 1 ? '#b9c0d0' : '#eef1f8')
    put(ox + x, oy + y, gray && isDay ? mix(c, '#d0d4dc', 0.5) : c)
  }))
  // nuvens
  const clouds = wet ? 4 : gray ? 3 : 2
  for (let i = 0; i < clouds; i++) {
    const cx = ((hash(i * 7) % (W + 12)) + Math.floor(n / (5 + i))) % (W + 12) - 9
    const cy = 2 + (i % 3) * 4 + (hash(i) % 2)
    const c = wet ? '#9aa1ad' : night > 0.5 ? '#2c3558' : gray ? '#d5d9e0' : '#ffffff'
    CLOUD.forEach((row, y) => [...row].forEach((ch, x) => {
      if (ch !== '.') put(cx + x, cy + y, y === 2 ? mix(c, '#000000', 0.12) : c)
    }))
  }
  // passarinho cruza o céu de vez em quando (não voa na chuva)
  const fly = n % 150
  if (!wet && fly < W + 4) {
    const frame = BIRD[Math.floor(n / 1) % 2]!
    const by = 9 + (fly % 6 < 3 ? 0 : 1)
    frame.forEach((row, y) => [...row].forEach((ch, x) => {
      if (ch !== '.') put(W - fly + x, by + y, night > 0.5 ? '#9aa3b5' : '#2b2b33')
    }))
  }
  // árvore à esquerda
  if (W >= 26) {
    TREE.forEach((row, y) => [...row].forEach((ch, x) => {
      if (ch !== '.') put(1 + x, gy - TREE.length + y, land(TREE_PAL[ch]!))
    }))
  }
  // grama com tufos e flores, terra embaixo
  for (let x = 0; x < W; x++) {
    const h = hash(x * 13 + 1)
    put(x, gy, land(h % 5 === 0 ? '#5cc062' : '#4caf50'))
    if (h % 4 === 0) put(x, gy - 1, land('#3d9140'))
    if (h % 17 === 0) put(x, gy - 1, land(h % 2 ? '#ff7aa8' : '#ffe066'))
    for (let y = gy + 1; y < H; y++) put(x, y, land(hash(x * 31 + y) % 7 === 0 ? '#5e3d22' : '#7a5230'))
  }

  // cenário em tons de cinza (como o tema); só personagem e magias têm cor
  for (const line of g) for (let x = 0; x < W; x++) if (line[x]) line[x] = mute(line[x]!)

  // personagem
  const sy = gy - sprite.length + 1 - sc.hop
  sprite.forEach((row, y) => row.forEach((c, x) => { if (c) put(sc.x + x, sy + y, c) }))

  if (sc.fx) {
    // a especial é desenhada olhando pra direita e espelhada em torno do centro (vira pra conversa)
    const axis = 2 * Math.floor((W - SPRITE_W) / 2) + SPRITE_W - 1
    const putM = (x: number, y: number, c: string) => put(axis - x, y, c)
    fx(sc.fx.kind, sc.fx.t, { put: putM, g, W: axis + 1, gy, x: axis - (sc.x + SPRITE_W - 1), sy, n })
  }

  // chuva por cima de tudo
  if (wet) {
    for (let i = 0; i < 22; i++) {
      const h = hash(i * 53 + 9)
      const x = (h % (W + 6)) - Math.floor(n / 1) % 3
      const y = ((h >> 8) + n * 3) % gy
      put(x, y, mute('#a8c8ff'))
      put(x, y + 1, mute('#7fa7e8'))
    }
  }
  return g
}

type Ctx = { put: (x: number, y: number, c: string) => void; g: Grid; W: number; gy: number; x: number; sy: number; n: number }

function fx(kind: string, t: number, c: Ctx) {
  const { put, W, gy, x, sy } = c
  const hx = x + 13 // mão, olhando pra direita
  const hy = sy + 11
  const ball = (cx: number, cy: number, r: number, inner: string, outer: string) => {
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      const d = dx * dx + dy * dy
      if (d <= r * r) put(cx + dx, cy + dy, d <= (r - 1) * (r - 1) ? inner : outer)
    }
  }
  switch (kind) {
    case 'shot': case 'missile': case 'hadouken': {
      const px = hx + 2 + 3 * t
      if (kind === 'shot') { ball(px, hy, 1, '#fff6a0', '#ffd23a'); put(px - 2, hy, '#ffe98a') }
      if (kind === 'missile') {
        for (let i = 0; i < 4; i++) put(px - i, hy, i === 0 ? '#ff4a3a' : '#f08a24')
        put(px - 5, hy, '#b0b0b0'); put(px - 7, hy - 1, '#8a8a8a'); put(px - 9, hy, '#6a6a6a')
      }
      if (kind === 'hadouken') {
        ball(px, hy, 2, '#e6f6ff', '#5ab0ff')
        put(px - 3, hy - 1, '#5ab0ff'); put(px - 4, hy + 1, '#3a80d0'); put(px - 5, hy, '#3a80d0')
      }
      break
    }
    case 'beam': { // carrega e solta o feixe até a borda
      if (t < 5) { ball(hx + 1, hy, 1 + (t % 2), '#ffffff', '#5fd8ff'); break }
      const thick = t < 13 ? 1 : 0
      for (let bx = hx + 1; bx < W; bx++) {
        for (let dy = -thick; dy <= thick; dy++) put(bx, hy + dy, dy === 0 ? '#ffffff' : '#5fd8ff')
      }
      ball(hx + 1, hy, 2, '#ffffff', '#5fd8ff')
      break
    }
    case 'bolt': { // céu pisca, raio cai na frente do personagem
      const bx = x + SPRITE_W + 6 < W ? x + SPRITE_W + 4 : Math.max(1, x - 5)
      if (t < 2) {
        for (let y = 0; y < gy; y++) for (let i = 0; i < W; i++) {
          const cur = c.g[y]![i]
          if (cur) c.g[y]![i] = mix(cur, '#ffffff', 0.45)
        }
      }
      if (t >= 1 && t < 6) {
        let lx = bx
        for (let y = 0; y < gy; y++) {
          if (y % 3 === 0) lx += (hash(y * 7 + t) % 3) - 1
          put(lx, y, '#fff27a'); put(lx + 1, y, '#ffd23a')
        }
      }
      if (t >= 5 && t < 9) for (let i = 0; i < 6; i++) put(bx - 3 + (hash(i + t) % 8), gy - 1 - (hash(i * 3) % 3), '#ffe066')
      break
    }
    case 'coin': {
      if (t < 8) {
        const cx = x + 7
        const cy = sy - 2 - t
        const w = t % 2 ? 1 : 2
        for (let dy = 0; dy < 3; dy++) for (let dx = 0; dx < w; dx++) put(cx + dx, cy + dy, dx === 0 && dy === 0 ? '#fff6a0' : '#f6d33a')
      }
      break
    }
    case 'ring': { // giro de espada: arco de luz ao redor
      const cx = x + 8
      const cy = sy + 11
      for (let k = 0; k < 4; k++) {
        const a = ((t * 2 + k) % 12) / 12 * Math.PI * 2
        put(Math.round(cx + Math.cos(a) * 10), Math.round(cy + Math.sin(a) * 6), ['#ffffff', '#dff2ff', '#9fd6ff', '#5fb0f0'][k]!)
      }
      break
    }
    case 'dash': { // rastro de velocidade
      for (const dy of [5, 10, 14]) for (let i = 1; i <= 5; i++) put(x - i, sy + dy, i < 3 ? '#cfe6ff' : '#7fb6ff')
      break
    }
    case 'roll': {
      if (t < 8) for (let i = 0; i < 3; i++) put(x + 12 + i * 2 + (t % 2), gy - 1 - (i % 2), '#c9b79a')
      break
    }
    case 'chomp': { // pastilhas fixas no chão; somem quando a boca passa
      const start = Math.floor((W - SPRITE_W) / 2)
      for (let i = 0; i < 3; i++) {
        const px = start + 16 + 3 * i
        if (x + 13 < px) { put(px, sy + 10, '#ffe9c4'); put(px + 1, sy + 10, '#ffe9c4') }
      }
      break
    }
    case 'wind': { // Kirby inspirando: correntes de ar vindo na direção da boca
      for (let i = 0; i < 5; i++) {
        const dist = (W - hx) - ((t * 3 + i * 7) % Math.max(1, W - hx))
        const y = sy + 5 + i * 2 + ((t + i) % 2)
        for (let k = 0; k < 3; k++) put(hx + dist + k, y, k === 0 ? '#ffffff' : '#cfe9ff')
      }
      break
    }
    case 'grenade': {
      if (t < 8) {
        put(hx + 2 * t, Math.round(hy - 5 * t + 0.7 * t * t), '#3a5a2a')
      } else {
        const ex = hx + 15
        const ey = gy - 2
        const r = (t - 8) * 2 + 1
        ball(ex, ey, Math.min(r, 5), t < 11 ? '#ffe066' : '#9a9a9a', t < 11 ? '#ff7a2a' : '#6a6a6a')
      }
      break
    }
  }
}

export type Cell = { ch: string; fg: string; bg: string; bold?: boolean }

/** Grade de pixels → células de texto: ▀ com cor de frente (pixel de cima) e fundo (de baixo). */
export function cells(g: Grid): Cell[][] {
  const out: Cell[][] = []
  for (let y = 0; y < g.length; y += 2) {
    out.push(g[y]!.map((top, x) => {
      const fg = top || '#000000'
      return { ch: '▀', fg, bg: g[y + 1]?.[x] || fg }
    }))
  }
  return out
}

const lum = (hex: string) =>
  0.299 * parseInt(hex.slice(1, 3), 16) + 0.587 * parseInt(hex.slice(3, 5), 16) + 0.114 * parseInt(hex.slice(5, 7), 16)

/**
 * Carimba texto no palco: a letra herda o fundo do cenário atrás dela (média dos dois pixels)
 * e a cor se ajusta ao contraste. `tone`: 'ink' texto, 'line' borda, ou uma cor fixa.
 */
export function stamp(c: Cell[][], row: number, col: number, text: string, tone: string, opts: { bold?: boolean; skipSpaces?: boolean } = {}) {
  const line = c[row]
  if (!line) return
  ;[...text].forEach((ch, i) => {
    const cell = line[col + i]
    if (!cell || (opts.skipSpaces && ch === ' ')) return
    const bg = cell.ch === '▀' ? mix(cell.fg, cell.bg, 0.5) : cell.bg
    const light = lum(bg) > 125
    const fg = tone === 'ink' ? (light ? '#15171c' : '#f4f4f4')
      : tone === 'line' ? (light ? '#3a3f4b' : '#c9ced8')
        : tone
    line[col + i] = { ch, fg, bg, bold: opts.bold }
  })
}

/** Junta células vizinhas iguais em um só trecho de texto. */
export function merge(c: Cell[][]) {
  return c.map(line => {
    const out: { fg: string; bg: string; bold?: boolean; text: string }[] = []
    for (const cell of line) {
      const last = out[out.length - 1]
      if (last && last.fg === cell.fg && last.bg === cell.bg && last.bold === cell.bold) last.text += cell.ch
      else out.push({ fg: cell.fg, bg: cell.bg, bold: cell.bold, text: cell.ch })
    }
    return out
  })
}

/** Atalho: pixels → trechos prontos (sem carimbos). */
export const rows = (g: Grid) => merge(cells(g))
