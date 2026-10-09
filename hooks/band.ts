// A especial que "vaza" do painel: faixa acima do prompt, na largura da conversa,
// 2 linhas (4 px) de altura, da direita (onde fica o painel) para a esquerda. Fundo transparente.
import type { Grid } from './sprites'
import type { FxKind } from './stage'
import { hash } from './stage'

export const BAND_MS: Record<FxKind, number> = {
  beam: 2200, shot: 1300, missile: 1500, hadouken: 1600, bolt: 1300, dash: 1000,
  chomp: 2600, coin: 1800, ring: 1400, wind: 1800, grenade: 1900, roll: 1800,
}

export function bandGrid(kind: FxKind, ms: number, W: number): Grid {
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
