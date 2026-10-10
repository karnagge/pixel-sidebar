// A especial que "vaza" do painel: faixa acima do prompt, na largura da conversa,
// 2 linhas (4 px) de altura, da direita (onde fica o painel) para a esquerda. Fundo transparente.
import type { Grid } from './sprites'
import type { FxKind } from './stage'
import { hash } from './stage'
import { halo } from './world'

export const BAND_MS: Record<FxKind, number> = {
  beam: 2200, shot: 1300, missile: 1500, hadouken: 1600, bolt: 1300, dash: 1000,
  chomp: 2600, coin: 1800, ring: 1400, wind: 1800, grenade: 1900, roll: 1800,
  gaster: 2200, harpoon: 2000, ice: 2200, glitch: 1400, fairy: 2000, duck: 2200, boom: 1700, whip: 1500,
  bomb: 1900, barrel: 2000, egg: 1800, sonicboom: 1400, omni: 1600, chains: 1800, airdash: 1100,
  invaders: 2400, lance: 1500, vent: 2000,
}

/** Faixa da especial; carregada (power) ganha 2 px de brilho em volta e fica com 3 linhas. */
export function bandGrid(kind: FxKind, ms: number, W: number, power?: number): Grid {
  const g = draw(kind, ms, W)
  if (!power) return g
  const big: Grid = [Array<string>(W).fill(''), ...g, Array<string>(W).fill('')]
  halo(big)
  return big
}

function draw(kind: FxKind, ms: number, W: number): Grid {
  const H = 4
  const g: Grid = Array.from({ length: H }, () => Array<string>(W).fill(''))
  const put = (x: number, y: number, c: string) => {
    x = Math.round(x)
    if (x >= 0 && x < W && y >= 0 && y < H) g[y]![x] = c
  }
  const p = Math.min(1, ms / BAND_MS[kind]) // progresso 0..1
  const lead = W - p * (W + 12) // frente do efeito, vindo da direita
  switch (kind) {
    case 'beam': { // feixe cresce da direita até a borda esquerda, segura e afina
      const front = Math.max(-2, W - Math.min(1, p / 0.45) * (W + 2))
      const thin = p > 0.85
      for (let x = Math.ceil(front); x < W; x++) {
        if (!thin) { put(x, 0, '#5fd8ff'); put(x, 3, '#5fd8ff') }
        put(x, 1, '#ffffff'); put(x, 2, thin ? '#5fd8ff' : '#ffffff')
      }
      if (p < 0.45) for (let y = 0; y < 4; y++) for (let d = -1; d <= 1; d++) put(front + d, y, d === 0 ? '#ffffff' : '#bff0ff')
      if (p >= 0.45 && p < 0.8) for (let i = 0; i < 6; i++) put(hash(i + Math.floor(ms / 90)) % 4, hash(i * 3) % 4, '#ffe066')
      break
    }
    case 'shot': case 'hadouken': case 'missile': {
      const x = lead
      if (kind === 'shot') {
        for (let y = 1; y < 3; y++) for (let d = 0; d < 3; d++) put(x + d, y, d === 0 ? '#fff6a0' : '#ffd23a')
        put(x + 4, 1, '#ffe98a'); put(x + 6, 2, '#ffe98a')
      } else if (kind === 'hadouken') {
        const wob = Math.floor(ms / 80) % 2
        for (let y = 0; y < 4; y++) for (let d = 0; d < 4; d++) put(x + d, y, (y === 1 || y === 2) && d < 3 ? '#e6f6ff' : '#5ab0ff')
        put(x + 5 + wob, 1, '#5ab0ff'); put(x + 7, 2 - wob, '#3a80d0'); put(x + 9, 1, '#3a80d0')
      } else {
        put(x, 1, '#ff4a3a'); put(x, 2, '#ff4a3a')
        for (let d = 1; d < 6; d++) { put(x + d, 1, '#f08a24'); put(x + d, 2, '#c86a14') }
        for (let i = 0; i < 6; i++) put(x + 8 + i * 3, (i + Math.floor(ms / 100)) % 4, ['#c0c0c0', '#9a9a9a', '#7a7a7a'][i % 3]!)
      }
      break
    }
    case 'dash': { // Sonic em bola, com rastro
      const x = lead
      for (let y = 0; y < 4; y++) for (let d = 0; d < 4; d++) {
        if ((y === 0 || y === 3) && (d === 0 || d === 3)) continue
        put(x + d, y, d < 2 && y < 2 ? '#5a9cff' : '#2a6ee6')
      }
      for (const y of [0, 1, 2, 3]) for (let d = 5; d < 5 + 10 + y * 3; d += 2) put(x + d, y, d < 9 ? '#cfe6ff' : '#7fb6ff')
      break
    }
    case 'chomp': { // Pac-Man atravessa comendo os pontinhos
      const x = lead
      for (let d = 2; d < W; d += 4) if (d < x) { put(d, 1, '#ffe9c4'); put(d + 1, 1, '#ffe9c4') }
      const open = Math.floor(ms / 120) % 2 === 0
      const pac = open ? ['YYY.', '..YY', '..YY', 'YYY.'] : ['.YY.', 'YYYY', 'YYYY', '.YY.']
      pac.forEach((row, y) => [...row].forEach((ch, d) => { if (ch === 'Y') put(x + d, y, '#f6d33a') }))
      break
    }
    case 'coin': { // moedas pulando pela tela
      for (let i = 0; i < 5; i++) {
        const x = lead + i * 7
        const y = Math.round(Math.abs(Math.sin(ms / 140 + i)) * 2)
        const w = (Math.floor(ms / 100) + i) % 2 ? 1 : 2
        for (let d = 0; d < w; d++) { put(x + d, y, '#fff6a0'); put(x + d, y + 1, '#f6d33a') }
      }
      break
    }
    case 'ring': { // raio da espada do Link (vida cheia!)
      const x = lead
      for (let d = 0; d < 7; d++) { put(x + d, 1, d === 0 ? '#ffffff' : '#dff2ff'); put(x + d, 2, '#9fd6ff') }
      put(x + 7, 0, '#e8c84a'); put(x + 7, 3, '#e8c84a'); put(x + 7, 1, '#7a4a24'); put(x + 7, 2, '#7a4a24')
      put(x + 8, 1, '#7a4a24'); put(x + 8, 2, '#7a4a24')
      if (Math.floor(ms / 70) % 2) for (let i = 0; i < 3; i++) put(x + 10 + i * 4, i % 4, '#ffffff')
      break
    }
    case 'wind': { // Kirby suga a tela: correntes indo pro painel
      for (let i = 0; i < 9; i++) {
        const x = (hash(i * 11) % W) + p * W * 1.4
        const y = hash(i * 5) % 4
        for (let d = 0; d < 4; d++) put((x + d) % W, y, d === 3 ? '#ffffff' : '#cfe9ff')
      }
      break
    }
    case 'grenade': { // granada voa e explode no meio da tela
      if (p < 0.5) {
        const x = W - (p / 0.5) * W * 0.6
        put(x, Math.round(3 - Math.sin((p / 0.5) * Math.PI) * 3), '#4a6a3a')
      } else {
        const ex = W * 0.4
        const r = Math.min(8, (p - 0.5) * 30)
        for (let y = 0; y < 4; y++) for (let d = -r; d <= r; d++) {
          if (Math.abs(d) + Math.abs(y - 1.5) * 2 > r) continue
          const k = Math.abs(d) / Math.max(1, r)
          put(ex + d, y, p > 0.8 ? (k < 0.5 ? '#9a9a9a' : '#6a6a6a') : k < 0.4 ? '#fff6a0' : k < 0.7 ? '#ffd23a' : '#ff7a2a')
        }
      }
      break
    }
    case 'bolt': { // relâmpago horizontal piscando
      if (Math.floor(ms / 110) % 3 === 2) break
      let y = 1
      for (let x = W - 1; x >= 0; x--) {
        if (x % 3 === 0) y = Math.max(0, Math.min(3, y + (hash(x + Math.floor(ms / 220)) % 3) - 1))
        put(x, y, '#fff27a')
        if (hash(x) % 4 === 0) put(x, Math.min(3, y + 1), '#ffd23a')
      }
      break
    }
    case 'gaster': { // caveira na beirada direita e o feixe atravessando
      const front = Math.max(-2, W - 8 - Math.min(1, p / 0.4) * W)
      const SK = ['.WW.', 'WkkW', 'WWWW', 'W.W.']
      SK.forEach((row, y) => [...row].forEach((ch, d) => { if (ch !== '.') put(W - 5 + d, y, ch === 'W' ? '#f2f2f2' : '#5fd8ff') }))
      if (p < 0.9) for (let x = Math.ceil(front); x < W - 5; x++) { put(x, 1, '#ffffff'); put(x, 2, p > 0.75 ? '#bfe8ff' : '#ffffff'); if (p <= 0.75) { put(x, 0, '#bfe8ff'); put(x, 3, '#bfe8ff') } }
      break
    }
    case 'harpoon': { // vai até a borda esquerda e volta puxando um pedaço
      const tip = p < 0.5 ? W - (p / 0.5) * (W + 2) : -2 + ((p - 0.5) / 0.5) * (W + 2)
      for (let x = Math.ceil(tip) + 1; x < W; x++) put(x, 1, x % 2 ? '#c8a040' : '#8a6a2a')
      put(tip, 0, '#e0e0e8'); put(tip, 1, '#ffffff'); put(tip, 2, '#e0e0e8'); put(tip - 1, 1, '#c9ced8')
      if (p >= 0.5) for (let d = 1; d <= 6; d++) { put(tip - 1 - d, 2, '#c9ced8'); put(tip - 1 - d, 3, '#8a8f9a') }
      break
    }
    case 'ice': { // bola de gelo, a faixa congela e racha
      if (p < 0.45) {
        const x = W - (p / 0.45) * (W + 6)
        for (let y = 1; y < 3; y++) for (let d = 0; d < 3; d++) put(x + d, y, d === 0 ? '#ffffff' : '#5ab8f0')
        for (let i = 1; i < 6; i++) put(x + 3 + i * 2, (i % 2) + 1, '#bfe8ff')
      } else {
        const crack = p > 0.75
        for (let x = 0; x < W; x++) for (let y = 0; y < 4; y++) {
          const h = hash(x * 4 + y)
          if (crack && h % 4 === 0) continue
          const fall = crack ? Math.floor((p - 0.75) * 20 * ((h % 3) + 1)) : 0
          if (y === 3 || h % 5 === 0) put(x, y + fall, h % 7 === 0 ? '#ffffff' : '#9fd6ff')
        }
      }
      break
    }
    case 'glitch': { // blocos corrompidos que vão se consertando
      const tick = Math.floor(ms / 80)
      for (let i = 0; i < W / 3; i++) {
        const h = hash(i * 7 + tick * 131)
        if (h % 100 >= 45 * (1 - p)) continue
        const col = ['#ff00ff', '#00ffff', '#ffff00', '#9a8ab0', '#e8e8f0'][h % 5]!
        for (let d = 0; d < 3; d++) put(i * 3 + d, (h >> 6) % 4, col)
      }
      break
    }
    case 'fairy': { // Navi atravessa em zigue-zague deixando brilho
      const at = (k: number) => [lead + k * 3, Math.round(1.5 + Math.sin((ms - k * 60) / 90) * 1.5)] as const
      for (let k = 6; k >= 0; k--) {
        const [x, y] = at(k)
        put(x, y, k === 0 ? '#ffffff' : k < 3 ? '#bfe8ff' : '#7fc8ff')
      }
      put(lead, at(0)[1] + 1, '#bfe8ff')
      break
    }
    case 'duck': { // patos cruzam, levam tiro e caem
      for (let i = 0; i < 2; i++) {
        const x = W - Math.min(p, 0.6) / 0.6 * W * 0.8 + i * 10
        const y = p < 0.6 ? 1 - i % 2 : 1 + Math.floor((p - 0.6) * 25)
        const flap = Math.floor(ms / 120 + i) % 2
        put(x, y, '#2a8a3a'); put(x - 1, y, '#ffd23a'); put(x + 1, y + 1, '#8a5a2a'); put(x, y + 1, '#8a5a2a')
        if (p < 0.6) put(x + 1, y + (flap ? 0 : 2), '#c8a070')
        if (p >= 0.6 && p < 0.68) { put(x - 1, y - 1, '#ffffff'); put(x + 2, y - 1, '#ffffff') }
      }
      break
    }
    case 'boom': { // explosão do creeper na beirada do painel, blocos voando
      const ex = W * 0.88
      const r = Math.min(10, p * 36)
      for (let y = 0; y < 4; y++) for (let d = -r; d <= r; d++) {
        if (Math.abs(d) + Math.abs(y - 1.5) * 2 > r) continue
        const k = Math.abs(d) / Math.max(1, r)
        put(ex + d, y, p > 0.75 ? (k < 0.5 ? '#9a9a9a' : '#6a6a6a') : k < 0.4 ? '#ffffff' : k < 0.7 ? '#ffe066' : '#ff7a2a')
      }
      for (let i = 0; i < 8; i++) put(ex - p * W * (0.3 + (hash(i) % 7) / 10), (hash(i * 3) % 4), i % 2 ? '#5ab84a' : '#3a8a32')
      break
    }
    case 'whip': case 'chains': { // estica até a borda, segura e recolhe
      const ext = p < 0.4 ? p / 0.4 : p < 0.7 ? 1 : (1 - p) / 0.3
      const front = W - ext * (W + 2)
      const lines = kind === 'whip' ? [1] : [0, 3]
      for (const y of lines) {
        for (let x = Math.ceil(front); x < W; x++) put(x, y, x % 2 ? '#c9ced8' : '#8a8f9a')
        if (kind === 'whip') { put(front, 0, '#ff9a3a'); put(front, 2, '#ff9a3a'); put(front - 1, 1, '#ffe066') }
        else { put(front, y, '#ffe066'); put(front + 1, y, '#ff7a2a'); put(front + 2, y, '#c83a1a'); put(front + 1 + (Math.floor(ms / 90) % 3), y === 0 ? 1 : 2, '#ff9a3a') }
      }
      break
    }
    case 'bomb': { // chama em cruz atravessando a tela
      const len = Math.min(W, (p / 0.4) * W)
      const fade = p > 0.8
      for (let x = W - 1; x >= W - len; x--) for (let y = 0; y < 4; y++) {
        if (fade && hash(x * 4 + y + Math.floor(ms / 100)) % 3) continue
        put(x, y, fade ? '#8a8a8a' : y === 1 || y === 2 ? '#ffffff' : x < W - len + 3 ? '#ff7a2a' : '#ffe066')
      }
      break
    }
    case 'barrel': { // barris rolando
      for (let i = 0; i < 3; i++) {
        const x = lead + i * 11
        for (let y = 0; y < 4; y++) for (let d = 0; d < 4; d++) {
          if ((y === 0 || y === 3) && (d === 0 || d === 3)) continue
          put(x + d, y, (d + Math.floor(ms / 90)) % 3 === 0 ? '#5a3a1a' : '#a06a30')
        }
      }
      break
    }
    case 'egg': { // ovo quicando
      const x = lead
      const y = Math.round(Math.abs(Math.sin(ms / 160)) * 1) - 1
      for (let dy = 0; dy < 4; dy++) for (let d = 0; d < 3; d++) {
        if ((dy === 0 || dy === 3) && d !== 1) continue
        put(x + d, y + dy, (d + dy + Math.floor(ms / 120)) % 3 === 0 ? '#4ac040' : '#f8f8f8')
      }
      break
    }
    case 'sonicboom': { // dois crescentes girando
      for (let i = 0; i < 2; i++) {
        const x = lead + i * 9
        const wob = Math.floor(ms / 70) % 2
        for (let y = 0; y < 4; y++) {
          const bend = Math.round(((y - 1.5) ** 2) / 1.2)
          put(x + bend, y, y === 1 || y === 2 ? '#ffffff' : '#ffe066')
          put(x + bend + 1 + wob, y, '#fff6a0')
        }
      }
      break
    }
    case 'omni': { // cortes diagonais pipocando pela tela
      for (let i = 0; i < 9; i++) {
        const born = i / 11
        if (p < born || p > born + 0.18) continue
        const x0 = hash(i * 19 + 3) % Math.max(1, W - 4)
        const dir = i % 2 ? 1 : -1
        for (let y = 0; y < 4; y++) put(x0 + (dir > 0 ? y : 3 - y), y, p < born + 0.08 ? '#ffffff' : '#9fd6ff')
      }
      break
    }
    case 'airdash': { // rastro rosa e azul
      const x = lead
      for (let d = 0; d < 16; d++) for (const y of [1, 2]) put(x + d, y - (d > 8 ? 1 : 0), d < 3 ? '#ffffff' : d < 9 ? '#ff8ab8' : '#8ad8ff')
      for (let i = 0; i < 4; i++) put(x + 4 + hash(i + Math.floor(ms / 100)) % 14, i % 2 ? 0 : 3, '#ffd6ea')
      break
    }
    case 'invaders': { // fileira marchando pra esquerda; um explode
      const step = Math.floor(ms / 250)
      const INV = ['.g.g.', 'ggggg', 'g.g.g']
      for (let i = 0; i < 6; i++) {
        const x = W - 4 - step * 3 + i * 8 - (W * 0.2)
        if (i === 2 && p > 0.55) { if (p < 0.7) for (let k = 0; k < 5; k++) put(x + hash(k + step) % 6, hash(k * 3) % 4, '#ffffff'); continue }
        INV.forEach((row, y) => [...row].forEach((ch, d) => { if (ch === 'g') put(x + d, y + (step % 2), '#5adc5a') }))
      }
      break
    }
    case 'lance': { // lanças voando
      for (let i = 0; i < 3; i++) {
        const x = lead + i * 14
        for (let d = 0; d < 7; d++) put(x + d, 1, '#c9ced8')
        put(x - 1, 1, '#ffffff'); put(x, 0, '#e8e8f0'); put(x, 2, '#e8e8f0')
      }
      break
    }
    case 'vent': { // sai de uma ventilação, corre e entra na outra
      for (const vx of [0, W - 6]) for (let d = 0; d < 6; d++) put(vx + d, 3, d % 2 ? '#2a2a33' : '#7a7f8a')
      if (p > 0.08 && p < 0.92) {
        const x = W - 6 - ((p - 0.08) / 0.84) * (W - 9)
        const y = Math.floor(ms / 120) % 2
        for (let d = 0; d < 3; d++) for (let dy = 0; dy < 3; dy++) put(x + d, y + dy, d === 0 && dy === 0 ? '#9ad8f0' : '#d8303a')
      }
      break
    }
    case 'roll': { // partículas douradas da Graça
      for (let i = 0; i < 12; i++) {
        const x = lead + hash(i * 7) % 30
        const y = (hash(i) + Math.floor(ms / 200)) % 4
        if ((i + Math.floor(ms / 150)) % 3) put(x, y, i % 2 ? '#f0c040' : '#fff0a0')
      }
      break
    }
  }
  return g
}
