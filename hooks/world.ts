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
  extra: { guest?: Grid; hat?: string } = {},
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

  // personagem (e o convidado do encontro)
  const sy = gy - sprite.length + 1 - sc.hop
  sprite.forEach((row, y) => row.forEach((c, x) => { if (c) put(sc.x + x, sy + y, c) }))
  if (extra.guest && sc.guest) {
    const gy0 = gy - extra.guest.length + 1 - sc.guest.hop
    extra.guest.forEach((row, y) => row.forEach((c, x) => { if (c) put(sc.guest!.x + x, gy0 + y, c) }))
  }
  if (extra.hat) { // boné do Kirby copiando: aba + copa na cor de quem ele engoliu
    const dark = mix(extra.hat, '#000000', 0.35)
    for (let i = 4; i <= 11; i++) put(sc.x + i, sy + 3, i === 4 || i === 11 ? dark : extra.hat)
    for (let i = 3; i <= 12; i++) put(sc.x + i, sy + 4, dark)
    for (let i = 6; i <= 9; i++) put(sc.x + i, sy + 2, extra.hat)
  }
  if (sc.clash !== undefined) { // faísca do duelo
    const cy = gy - 10
    for (const [dx, dy, c] of [[0, 0, '#ffffff'], [1, 0, '#ffe066'], [-1, 0, '#ffe066'], [0, 1, '#ffe066'], [0, -1, '#ffe066'], [2, -2, '#ff9a3a'], [-2, 2, '#ff9a3a'], [2, 2, '#ff9a3a'], [-2, -2, '#ff9a3a']] as const) {
      put(sc.clash + dx, cy + dy, c)
    }
  }

  if (sc.fx) {
    // a especial é desenhada olhando pra direita e espelhada em torno do centro (vira pra conversa);
    // vai numa camada à parte pra especial carregada ganhar um brilho em volta
    const axis = 2 * Math.floor((W - SPRITE_W) / 2) + SPRITE_W - 1
    const layer: Grid = Array.from({ length: H }, () => Array<string>(W).fill(''))
    const putM = (x: number, y: number, c: string) => {
      const X = axis - Math.round(x)
      if (X >= 0 && X < W && y >= 0 && y < H) layer[Math.round(y)]![X] = c
    }
    const isBody = (x: number, y: number) => !!sprite[y - sy]?.[axis - x - sc.x]
    fx(sc.fx.kind, sc.fx.t, { put: putM, g, W: axis + 1, gy, x: axis - (sc.x + SPRITE_W - 1), sy, n, isBody })
    if (sc.fx.power) halo(layer)
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (layer[y]![x]) g[y]![x] = layer[y]![x]!
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

type Ctx = {
  put: (x: number, y: number, c: string) => void; g: Grid; W: number; gy: number; x: number; sy: number; n: number
  isBody: (x: number, y: number) => boolean
}

/** Brilho em volta de tudo que já está na camada (especial carregada). */
export function halo(layer: Grid) {
  const H = layer.length
  const W = layer[0]?.length ?? 0
  const glow: [number, number, string][] = []
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (layer[y]![x]) continue
    const near = [layer[y - 1]?.[x], layer[y + 1]?.[x], layer[y]![x - 1], layer[y]![x + 1]].find(Boolean)
    if (near) glow.push([x, y, mix(near, '#ffffff', 0.55)])
  }
  for (const [x, y, c] of glow) layer[y]![x] = c
}

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
    case 'gaster': { // caveira aparece no alto e solta o feixe
      const sx = x + 12 // no alto, à frente da cabeça
      const sk = Math.max(0, sy - 7)
      const jaw = t >= 4 ? 1 : 0
      const SKULL = ['.WWWWW.', 'WWWWWWW', 'WkkWkkW', 'WkcWkcW', 'WWWkWWW']
      if (t >= 1) SKULL.forEach((row, y) => [...row].forEach((ch, d) => {
        if (ch !== '.') put(sx + d, sk + y, ch === 'W' ? '#f2f2f2' : ch === 'c' ? (t % 2 ? '#5fd8ff' : '#ffe066') : '#111111')
      }))
      if (t >= 1) for (const d of [0, 2, 4, 6]) put(sx + d, sk + 5 + jaw, '#f2f2f2')
      if (t >= 4 && t < 13) {
        const th = t < 11 ? 1 : 0
        for (let bx = sx + 7; bx < W; bx++) for (let dy = -th; dy <= th; dy++) put(bx, sk + 4 + dy, dy === 0 ? '#ffffff' : '#bfe8ff')
      }
      break
    }
    case 'harpoon': { // arpão vai até a borda e volta puxando um pedaço da tela
      const start = Math.floor((W - SPRITE_W) / 2)
      const out = Math.ceil((start + 3) / 4)
      const reach = t < out ? 4 * (t + 1) : Math.max(0, 4 * (2 * out - t))
      const tip = Math.min(W, hx + 1 + reach)
      for (let i = hx + 1; i < tip; i++) put(i, hy - 1, i % 2 ? '#c8a040' : '#8a6a2a')
      put(tip, hy - 2, '#e0e0e8'); put(tip, hy - 1, '#ffffff'); put(tip, hy, '#e0e0e8'); put(tip + 1, hy - 1, '#c9ced8')
      if (t >= out && reach > 0) for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) put(tip + 2 + i, hy - 2 + j, j ? '#8a8f9a' : '#c9ced8')
      break
    }
    case 'ice': {
      const px = hx + 2 + 3 * t
      ball(px, hy, 1, '#ffffff', '#5ab8f0')
      for (let i = 1; i <= 5; i++) put(px - 2 * i, hy + (i % 2) - 1 + (t % 2), i < 3 ? '#bfe8ff' : '#7fc0f0')
      break
    }
    case 'sonicboom': {
      const px = hx + 2 + 3 * t
      for (let dy = -3; dy <= 3; dy++) {
        const bend = Math.floor((dy * dy) / 3)
        put(px - bend, hy + dy, dy === 0 ? '#ffffff' : '#ffe066')
        put(px - bend - 1, hy + dy, '#fff6a0')
        if (Math.abs(dy) < 3 && t % 2) put(px - bend - 3, hy + dy, '#ffd23a')
      }
      break
    }
    case 'barrel': { // barril rolando e quicando no chão
      const bx = hx + 2 + 3 * t
      const by = gy - 4 - (t % 3 === 0 ? 1 : 0)
      for (let dy = 0; dy < 4; dy++) for (let d = 0; d < 4; d++) {
        if ((dy === 0 || dy === 3) && (d === 0 || d === 3)) continue
        put(bx + d, by + dy, (d + t) % 3 === 0 ? '#5a3a1a' : '#a06a30')
      }
      break
    }
    case 'lance': { // lança atravessa; no fim o Arthur leva um golpe e a armadura voa
      const px = hx + 2 + 4 * t
      if (px < W) {
        for (let i = 0; i < 6; i++) put(px - i, hy, '#c9ced8')
        put(px + 1, hy, '#ffffff'); put(px, hy - 1, '#e8e8f0'); put(px, hy + 1, '#e8e8f0')
      }
      const start = Math.floor((W - SPRITE_W) / 2)
      const hit = Math.ceil((W - start) / 4) + 2
      if (t >= hit && t < hit + 4) {
        const k = t - hit
        for (let i = 0; i < 6; i++) put(x + 2 + i * 2 + (i % 2 ? k : -k), sy + 4 + i * 2 - 3 * k + k * k, i % 2 ? '#b8c0cc' : '#8a92a0')
      }
      break
    }
    case 'glitch': { // MissingNo. bagunça o palco por um instante
      if (t < 8) {
        for (let r = 0; r < 4; r++) {
          const y = hash(r * 13 + t) % gy
          const sh = (hash(r + t * 3) % 7) - 3
          const row = c.g[y]!
          const copy = [...row]
          for (let i = 0; i < row.length; i++) row[i] = copy[(i - sh + row.length) % row.length]!
        }
        for (let i = 0; i < 8; i++) {
          const h = hash(i * 31 + t * 7)
          const col = ['#ff00ff', '#00ffff', '#ffff00', '#1b1b1b', '#9a8ab0'][h % 5]!
          for (let d = 0; d < 3; d++) put((h >> 4) % W + d, (h >> 12) % gy, col)
        }
      }
      break
    }
    case 'fairy': { // "!" e depois a Navi dá uma volta brilhando e sai voando
      if (t < 4) { for (let y = 0; y < 3; y++) put(x + 7, sy + 1 + y, '#ffe066'); put(x + 7, sy + 5, '#ffe066') }
      const pos = (k: number) => k < 10
        ? [x + 8 + Math.cos(k * 0.8) * 10, sy + 9 + Math.sin(k * 0.8) * 5]
        : [x + 8 + (k - 9) * 6, sy + 9 - (k - 9)]
      for (let i = 0; i < 4; i++) {
        if (t - i < 0) continue
        const [px, py] = pos(t - i)
        put(px!, Math.round(py!), ['#ffffff', '#bfe8ff', '#7fc8ff', '#4a90d0'][i]!)
      }
      break
    }
    case 'duck': { // patos sobem da grama, tiro, caem; o cachorro ri
      if (t === 6) for (let y = 0; y < gy; y++) for (let i = 0; i < c.g[y]!.length; i++) {
        const cur = c.g[y]![i]
        if (cur) c.g[y]![i] = mix(cur, '#ffffff', 0.5)
      }
      for (let i = 0; i < 2; i++) {
        const dx = hx + 4 + i * 7
        const dy = t < 6 ? gy - 2 - 3 * t - i * 2 : gy - 20 - i * 2 + 4 * (t - 6)
        if (t >= 12 || dy >= gy) continue
        const flap = t < 6 && (t + i) % 2
        put(dx, dy, '#2a8a3a'); put(dx + 1, dy, '#ffd23a')
        put(dx - 1, dy + 1, '#8a5a2a'); put(dx, dy + 1, '#8a5a2a')
        put(dx - 1, dy + (flap ? 0 : 2), '#c8a070')
      }
      break
    }
    case 'boom': { // creeper pisca... e explode
      if (t < 6 && t % 2 === 0) for (let y = sy; y < sy + 20; y++) for (let i = x; i < x + SPRITE_W; i++) if (c.isBody(i, y)) put(i, y, '#f4f4f4')
      if (t >= 6) {
        const r = Math.min(2 + (t - 6) * 2, 9)
        const smoke = t >= 11
        ball(x + 8, sy + 12, r, smoke ? '#9a9a9a' : t < 8 ? '#ffffff' : '#ffe066', smoke ? '#6a6a6a' : '#ff7a2a')
        for (let i = 0; i < 6; i++) put(x + 8 + Math.round(Math.cos(i) * (r + 3)), sy + 12 + Math.round(Math.sin(i) * (r + 2)), i % 2 ? '#5ab84a' : '#7a7a7a')
      }
      break
    }
    case 'whip': { // chicote estala reto até a borda
      if (t < 2) { for (let i = 0; i < 4; i++) put(hx - 1 - i, hy - 1 - i, '#b8b8c0'); break }
      const len = t < 8 ? Math.min(W - hx, (t - 1) * 12) : Math.max(0, (W - hx) - (t - 7) * 14)
      for (let i = 1; i <= len; i++) put(hx + i, hy - 1, i % 2 ? '#c9ced8' : '#8a8f9a')
      if (len >= W - hx - 1) { put(W - 1, hy - 2, '#ff9a3a'); put(W - 1, hy, '#ff9a3a'); put(W - 2, hy - 1, '#ffe066') }
      break
    }
    case 'bomb': { // bomba no chão, pavio, explosão em cruz
      const start = Math.floor((W - SPRITE_W) / 2)
      const bx = start + 17
      const by = gy - 3
      if (t < 6) {
        ball(bx, by, 2, '#2a2a33', '#14141a'); put(bx - 1, by - 1, '#6a6a7a')
        put(bx + 1, by - 3, '#c8a040'); put(bx + 2, by - 4, t % 2 ? '#ffe066' : '#ff6a3a')
      } else {
        const len = Math.min((t - 5) * 6, W)
        const fade = t >= 11
        for (let d = -len; d <= len; d++) for (let dy = -1; dy <= 1; dy++) {
          if (fade && (hash(d * 7 + dy + t) % 3)) continue
          put(bx + d, by + dy, fade ? '#8a8a8a' : dy === 0 ? '#ffffff' : Math.abs(d) > len - 3 ? '#ff7a2a' : '#ffe066')
        }
        for (let up = 1; up <= Math.min(len, 10); up++) for (let dx = -1; dx <= 1; dx++) {
          if (fade && (hash(up * 5 + dx + t) % 3)) continue
          put(bx + dx, by - up, fade ? '#8a8a8a' : dx === 0 ? '#ffffff' : '#ffd23a')
        }
      }
      break
    }
    case 'egg': { // língua, depois o ovo em arco
      if (t < 4) {
        const len = [3, 7, 7, 3][t]!
        for (let i = 1; i <= len; i++) put(x + 13 + i, sy + 5, '#e0302a')
        put(x + 14 + len, sy + 5, '#ff8aa8')
      } else {
        const k = t - 4
        const ex = hx + 2 + 4 * k
        const ey = sy + 6 - Math.round(Math.sin((k / 9) * Math.PI) * 7)
        for (let dy = 0; dy < 4; dy++) for (let d = 0; d < 3; d++) {
          if ((dy === 0 || dy === 3) && d !== 1) continue
          put(ex + d, ey + dy, (d + dy + k) % 3 === 0 ? '#4ac040' : '#f8f8f8')
        }
      }
      break
    }
    case 'omni': { // Omnislash: cortes por toda parte, e o X final
      if (t < 10) {
        for (const k of [t, t - 1]) {
          if (k < 0) continue
          const h = hash(k * 17 + 5)
          const ox = x - 4 + (h % Math.max(1, W - x))
          const oy = sy + 2 + ((h >> 8) % 12)
          const dir = k % 2 ? 1 : -1
          for (let i = 0; i < 8; i++) put(ox + i, oy + dir * Math.floor(i / 1.5), k === t ? (i > 5 ? '#ffffff' : '#9fd6ff') : '#5a8ab8')
        }
      } else {
        const cxx = hx + 6
        const cyy = hy - 3
        for (let i = -6; i <= 6; i++) { put(cxx + i, cyy + Math.round(i * 0.7), '#fff6a0'); put(cxx + i, cyy - Math.round(i * 0.7), '#fff6a0') }
      }
      break
    }
    case 'chains': { // Lâminas do Caos: giram em volta e depois disparam
      const tips: [number, number][] = []
      if (t < 5) {
        const a = t * 1.3
        tips.push([hx + Math.cos(a) * 9, hy - 2 + Math.sin(a) * 6], [hx + Math.cos(a + Math.PI) * 9, hy - 2 + Math.sin(a + Math.PI) * 6])
      } else {
        const reach = t < 9 ? (t - 4) * 8 : Math.max(2, (13 - t) * 8)
        tips.push([Math.min(W - 1, hx + reach), hy - 3], [Math.min(W - 1, hx + reach - 3), hy + 1])
      }
      for (const [tx, ty] of tips) {
        const steps = Math.max(1, Math.round(Math.hypot(tx - hx, ty - hy) / 2))
        for (let i = 1; i < steps; i++) put(hx + ((tx - hx) * i) / steps, Math.round(hy + ((ty - hy) * i) / steps), '#8a8f9a')
        put(tx, Math.round(ty), '#ffe066'); put(tx - 1, Math.round(ty), '#ff7a2a'); put(tx - 2, Math.round(ty), '#c83a1a')
        put(tx, Math.round(ty) - 1 - (t % 2), '#ff9a3a')
      }
      break
    }
    case 'airdash': { // rastro rosa/azul e poeira na saída
      if (t < 3) for (let i = 0; i < 4; i++) put(x + 2 + i * 3, gy - 1 - (i % 2), '#c9b79a')
      if (t >= 2 && t < 8) for (let i = 1; i <= 6; i++) for (const dy of [4, 9, 14]) put(x - i, sy + dy + Math.floor(i / 2), i < 3 ? '#8ad8ff' : '#ff8ab8')
      break
    }
    case 'invaders': { // fileira de invasores marchando; o Invader acerta um
      const INV = ['.g.g.', 'ggggg', 'g.g.g']
      const step = Math.floor(t / 2) % 2 ? 2 : 0
      const baseY = 2 + Math.floor(t / 4) * 2
      for (let i = 0; i < 3; i++) {
        const ix = hx - 6 + i * 8 + step
        if (i === 1 && t >= 10) {
          if (t < 13) for (let k = 0; k < 5; k++) put(ix + (hash(k + t) % 6), baseY + (hash(k * 3) % 4), '#ffffff')
          continue
        }
        INV.forEach((row, y) => [...row].forEach((ch, d) => { if (ch === 'g') put(ix + d, baseY + y, '#5adc5a') }))
      }
      if (t >= 6 && t < 10) for (let y = sy + 4; y > baseY + 3; y--) put(hx - 6 + 8 + step + 2 + ((y + t) % 2), y, '#ffffff')
      break
    }
    case 'vent': { // duas ventilações no chão: entra numa e sai na outra
      const start = Math.floor((W - SPRITE_W) / 2)
      for (const vx of [start + 18, start - 8]) for (let d = 0; d < 6; d++) {
        put(vx + d, gy, d % 2 ? '#2a2a33' : '#7a7f8a'); put(vx + d, gy - 1, '#4a4f5a')
      }
      if (t >= 3 && t < 5) for (let i = 0; i < 4; i++) put(start + 18 + (hash(i + t) % 6), gy - 2 - (hash(i) % 3), '#c9ced8')
      if (t >= 9 && t < 11) for (let i = 0; i < 4; i++) put(start - 8 + (hash(i + t) % 6), gy - 2 - (hash(i) % 3), '#c9ced8')
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
