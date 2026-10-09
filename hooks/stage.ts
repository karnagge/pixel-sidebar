// Diretor de cena: cada personagem fica TURN ticks (700ms) no palco, começando no centro.
// Roteiro do turno: entra falando o bordão; depois faz a especial (1 em 3), passeia ou dá pulinhos;
// no meio comenta algo; termina de volta ao centro.
export const TURN = 128 // ~90s
export const SPRITE_W = 16
const HELLO = [2, 16] as const
const ACT_AT = 24
const CHAT = [76, 94] as const

export type FxKind =
  | 'coin' | 'ring' | 'dash' | 'bolt' | 'roll' | 'chomp' | 'wind'
  | 'shot' | 'missile' | 'hadouken' | 'grenade' | 'beam'

export const SPECIAL: Record<string, FxKind> = {
  Mario: 'coin', Link: 'ring', Sonic: 'dash', Crono: 'bolt', Tarnished: 'roll',
  'Pac-Man': 'chomp', Kirby: 'wind', 'Mega Man': 'shot', Samus: 'missile',
  Pikachu: 'bolt', 'Master Chief': 'grenade', Goku: 'beam', Ryu: 'hadouken', 'Black Mage': 'bolt',
}

export const hash = (n: number) => {
  let h = (n ^ 0x9e3779b9) >>> 0
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b) >>> 0
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0
  return (h ^ (h >>> 16)) >>> 0
}

export type Talk = { kind: 'hello' | 'chat' | 'shout'; since: number; key: string }
export type Scene = {
  turn: number
  idx: number
  seed: number
  x: number
  flip: boolean
  hop: number
  fx: { kind: FxKind; t: number } | null
  talk: Talk | null
}

const HOPS = [0, 2, 4, 5, 5, 4, 2, 0]

/** Quanto dura a especial e onde o personagem está em cada tick dela. */
export function fxMotion(kind: FxKind, t: number, cx: number, W: number) {
  const right = W - SPRITE_W
  switch (kind) {
    case 'dash': { // sai correndo pela direita e volta pela esquerda
      const out = Math.ceil((W - cx) / 3)
      const back = Math.ceil((cx + SPRITE_W) / 3)
      const x = t < out ? cx + 3 * t : Math.min(cx, -SPRITE_W + 3 * (t - out))
      return { dur: out + back + 1, x, hop: 0, flip: false }
    }
    case 'roll': {
      const x = t < 5 ? cx - 2 * t : t < 8 ? cx - 10 : Math.min(cx, cx - 10 + 2 * (t - 8))
      return { dur: 14, x: Math.max(0, x), hop: t < 5 ? (t % 2) : 0, flip: t < 5 }
    }
    case 'chomp': { // anda pra direita comendo as pastilhas e volta
      const go = Math.max(0, Math.min(12, right - cx))
      const x = t < go ? cx + t : Math.max(cx, cx + go - (t - go))
      return { dur: 2 * go + 1, x, hop: 0, flip: t >= go }
    }
    case 'coin': return { dur: 10, x: cx, hop: HOPS[t] ?? 0, flip: false }
    case 'shot': case 'missile': case 'hadouken':
      return { dur: Math.ceil((W - cx) / 3) + 4, x: cx, hop: 0, flip: false }
    case 'beam': return { dur: 16, x: cx, hop: 0, flip: false }
    case 'grenade': return { dur: 14, x: cx, hop: 0, flip: false }
    case 'wind': return { dur: 14, x: cx, hop: 0, flip: false }
    case 'ring': return { dur: 12, x: cx, hop: t % 4 === 1 ? 1 : 0, flip: false }
    case 'bolt': return { dur: 10, x: cx, hop: 0, flip: false }
  }
}

export type Force = { at: number; idx: number; loud?: boolean } // especial forçada a partir do tick `at` (loud: veio do /especial)

/** Especiais acontecem virados para a conversa (esquerda): o movimento é espelhado em torno do centro. */
export function fxMove(kind: FxKind, t: number, cx: number, W: number) {
  const m = fxMotion(kind, t, cx, W)
  return { ...m, x: 2 * cx - m.x, flip: !m.flip }
}

/** Tick da especial em que ela chega à borda esquerda do painel e "vaza" para a tela. */
export function escapeAt(kind: FxKind, cx: number, W: number): number {
  switch (kind) {
    case 'beam': return 5
    case 'shot': case 'missile': case 'hadouken': return Math.ceil(cx / 3)
    case 'dash': return Math.ceil((cx + SPRITE_W) / 3)
    case 'chomp': return Math.max(1, Math.min(12, W - SPRITE_W - cx))
    case 'grenade': return 5
    case 'ring': return 4
    case 'coin': return 3
    case 'roll': return 3
    case 'wind': case 'bolt': return 2
  }
}

export function scene(n: number, seed0: number, names: string[], W: number, force?: Force): Scene {
  const turn = Math.floor(n / TURN)
  const t = n % TURN
  const seed = hash(turn * 31 + seed0)
  // 5 e 14 são coprimos: percorre todos sem repetir em sequência
  const idx = (turn * 5 + seed0) % names.length
  const right = Math.max(0, W - SPRITE_W)
  const cx = Math.floor(right / 2)
  let x = cx
  let flip = false
  let hop = 0
  let fx: Scene['fx'] = null
  let talk: Talk | null = null
  if (force && n > force.at && n - force.at < 200) {
    const kind = SPECIAL[names[force.idx]!] ?? 'coin'
    const a = n - force.at - 1
    const m = fxMove(kind, a, cx, W)
    if (a < m.dur) {
      return {
        turn, idx: force.idx, seed: 0, x: m.x, flip: m.flip, hop: m.hop, fx: { kind, t: a },
        talk: a < 10 ? { kind: 'shout', since: a, key: `f${force.at}:shout` } : null,
      }
    }
  }
  const plan = seed % 3 // 0 especial, 1 passeio, 2 pulinhos
  const a = t - ACT_AT
  if (plan === 0 && a >= 0) {
    const kind = SPECIAL[names[idx]!] ?? 'coin'
    const m = fxMove(kind, a, cx, W)
    if (a < m.dur) {
      fx = { kind, t: a }
      ;({ x, hop, flip } = m)
      if (a < 10) talk = { kind: 'shout', since: a, key: `${turn}:shout` }
    }
  } else if (plan === 1 && a >= 0 && right >= 6) {
    // centro → esquerda → direita → centro
    if (a < cx) { x = cx - a - 1; flip = true }
    else if (a < cx + right) { x = a - cx + 1 }
    else if (a < 2 * right) { x = right - (a - cx - right) - 1; flip = true }
    x = Math.max(0, Math.min(right, x))
  } else if (plan === 2 && a >= 0 && a < 24) {
    hop = HOPS[a % 8] ?? 0
  }
  if (!talk && t >= HELLO[0] && t < HELLO[1]) talk = { kind: 'hello', since: t - HELLO[0], key: `${turn}:hello` }
  if (!talk && t >= CHAT[0] && t < CHAT[1]) talk = { kind: 'chat', since: t - CHAT[0], key: `${turn}:chat` }
  return { turn, idx, seed, x, flip, hop, fx, talk }
}

function wrap(text: string, width: number): string[] {
  const out: string[] = []
  let line = ''
  for (const word of text.split(' ')) {
    const w = word.length > width ? word.slice(0, width - 1) + '…' : word
    if (!line) line = w
    else if (line.length + 1 + w.length <= width) line += ' ' + w
    else { out.push(line); line = w }
  }
  if (line) out.push(line)
  return out.slice(0, 3)
}

/**
 * Caixa de diálogo estilo RPG: nome na borda, texto surgindo letra a letra,
 * ▼ piscando quando termina e rabinho apontando para a cabeça (col `tail`).
 */
export function bubble(name: string, text: string, since: number, width: number, tail: number, blink: boolean) {
  const inner = width - 4
  const lines = wrap(text, inner)
  let budget = Math.max(0, since * 6) // 6 letras por tick
  const total = lines.join('').length
  const shown = lines.map(l => {
    const part = l.slice(0, budget)
    budget = Math.max(0, budget - l.length)
    return part
  })
  const done = shown.join('').length >= total
  const label = `─ ${name} `
  const top = '╭' + label + '─'.repeat(Math.max(0, width - 2 - label.length)) + '╮'
  const body = shown.map((l, i) => {
    const last = i === shown.length - 1
    const pad = inner - l.length
    const mark = last && done && blink ? '▼' : ' '
    return '│ ' + l + ' '.repeat(Math.max(0, pad - 1)) + (pad > 0 ? mark : '') + ' │'
  })
  const t = Math.min(Math.max(tail, 2), width - 4)
  const bottom = '╰' + '─'.repeat(t - 1) + '╮ ╭' + '─'.repeat(width - t - 4) + '╯'
  const stem = ' '.repeat(t + 1) + '╲'
  return { top, body, bottom, stem }
}
