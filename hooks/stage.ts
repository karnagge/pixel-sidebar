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
  | 'gaster' | 'harpoon' | 'ice' | 'glitch' | 'fairy' | 'duck' | 'boom' | 'whip' | 'bomb'
  | 'barrel' | 'egg' | 'sonicboom' | 'omni' | 'chains' | 'airdash' | 'invaders' | 'lance' | 'vent'

export const SPECIAL: Record<string, FxKind> = {
  Mario: 'coin', Link: 'ring', Sonic: 'dash', Crono: 'bolt', Tarnished: 'roll',
  'Pac-Man': 'chomp', Kirby: 'wind', 'Mega Man': 'shot', Samus: 'missile',
  Pikachu: 'bolt', 'Master Chief': 'grenade', Goku: 'beam', Ryu: 'hadouken', 'Black Mage': 'bolt',
  Sans: 'gaster', Scorpion: 'harpoon', 'Sub-Zero': 'ice', 'MissingNo.': 'glitch', Navi: 'fairy',
  'Duck Hunt': 'duck', Creeper: 'boom', Simon: 'whip', Bomberman: 'bomb', 'Donkey Kong': 'barrel',
  Yoshi: 'egg', Guile: 'sonicboom', Cloud: 'omni', Kratos: 'chains', Madeline: 'airdash',
  Invader: 'invaders', Arthur: 'lance', Tripulante: 'vent',
}

// Encontros: dois personagens no palco ao mesmo tempo.
export type MeetKind = 'race' | 'duel' | 'chase'
const PAIRS: [string, string, MeetKind][] = [
  ['Mario', 'Sonic', 'race'], ['Ryu', 'Guile', 'duel'], ['Scorpion', 'Sub-Zero', 'duel'], ['Pac-Man', 'Blinky', 'chase'],
]
export function partner(name: string): { guest: string; kind: MeetKind } | null {
  for (const [a, b, kind] of PAIRS) {
    if (a === name) return { guest: b, kind }
    if (b === name) return { guest: a, kind }
  }
  return null
}

export const hash = (n: number) => {
  let h = (n ^ 0x9e3779b9) >>> 0
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b) >>> 0
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0
  return (h ^ (h >>> 16)) >>> 0
}

// enc: fala do encontro; who diz quem fala (o balão aponta pra ele), line 0 abre e 1 responde
export type Talk = { kind: 'hello' | 'chat' | 'shout' | 'enc'; since: number; key: string; who?: 'guest'; line?: 0 | 1 }
export type Pose = { name: string; x: number; flip: boolean; hop: number; alt?: boolean }
export type Scene = {
  turn: number
  idx: number
  seed: number
  x: number
  flip: boolean
  hop: number
  fx: { kind: FxKind; t: number; power?: number } | null
  talk: Talk | null
  alt?: boolean // usa a variação do sprite (Madeline de cabelo azul, Arthur sem armadura)
  hat?: string // Kirby copiou alguém: chapéu na cor desse personagem
  guest?: Pose // encontro
  clash?: number // faísca do duelo nessa coluna
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
    case 'ice': case 'sonicboom': case 'barrel':
      return { dur: Math.ceil((W - cx) / 3) + 4, x: cx, hop: 0, flip: false }
    case 'lance': return { dur: Math.ceil((W - cx) / 4) + 8, x: cx, hop: 0, flip: false }
    case 'harpoon': { // ida e volta da corda
      const out = Math.ceil((cx + 3) / 4)
      return { dur: 2 * out + 3, x: cx, hop: 0, flip: false }
    }
    case 'glitch': return { dur: 10, x: t < 8 ? cx + [0, 1, -1][t % 3]! : cx, hop: 0, flip: t % 4 === 3 }
    case 'duck': return { dur: 16, x: cx, hop: [0, 2, 3, 2][t - 12] ?? 0, flip: false }
    case 'bomb': { // planta a bomba, recua e volta depois da explosão
      const back = t < 3 ? 0 : t < 7 ? t - 2 : t < 11 ? 4 : Math.max(0, 4 - 2 * (t - 10))
      return { dur: 14, x: Math.max(0, cx - back), hop: 0, flip: t >= 3 && t < 7 }
    }
    case 'omni': { // Cloud teleporta cortando
      const j = t < 10 ? (hash(t * 7 + 1) % 7) - 3 : 0
      return { dur: 14, x: Math.max(0, Math.min(right, cx + j)), hop: t < 10 ? hash(t) % 3 : 0, flip: t < 10 && t % 2 === 1 }
    }
    case 'airdash': { // dash na diagonal, pra cima e pra frente
      const d = [0, 0, 2, 4, 6, 8, 7, 6, 4, 3, 1, 0][t] ?? 0
      return { dur: 12, x: cx + Math.min(d, cx), hop: d, flip: false }
    }
    case 'vent': { // entra numa ventilação e sai na outra
      const x = t < 4 ? cx + t : t < 10 ? -999 : Math.min(cx, cx - 6 + (t - 10))
      return { dur: 17, x, hop: 0, flip: false }
    }
    case 'gaster': case 'chains': case 'egg': case 'boom': case 'invaders': case 'fairy':
      return { dur: kind === 'chains' ? 12 : kind === 'fairy' || kind === 'invaders' ? 16 : 14, x: cx, hop: 0, flip: false }
    case 'whip': return { dur: 10, x: cx, hop: 0, flip: false }
  }
}

// especial forçada a partir do tick `at` (loud: veio do /especial; power: carregada; enc: encontro em vez de especial)
export type Force = { at: number; idx: number; loud?: boolean; power?: number; enc?: boolean }

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
    case 'wind': case 'bolt': case 'glitch': return 2
    case 'ice': case 'sonicboom': case 'barrel': return Math.ceil(cx / 3)
    case 'lance': return Math.ceil(cx / 4)
    case 'harpoon': return Math.ceil((cx + 1) / 4)
    case 'gaster': case 'fairy': return 6
    case 'duck': return 5
    case 'boom': case 'vent': return 8
    case 'whip': case 'chains': case 'airdash': case 'invaders': return 4
    case 'bomb': case 'egg': return 7
    case 'omni': return 3
  }
}

/** Sequência da especial: o Kirby primeiro inspira e depois solta a especial de quem engoliu. */
function moves(name: string, copy: string): { kinds: FxKind[]; hat?: string } {
  const own = SPECIAL[name] ?? 'coin'
  if (name !== 'Kirby') return { kinds: [own] }
  const got = SPECIAL[copy]
  return got && got !== 'wind' ? { kinds: ['wind', got], hat: copy } : { kinds: ['wind'] }
}

/** Onde a especial está no tick `a` (null: acabou). */
function act(kinds: FxKind[], a: number, cx: number, W: number) {
  let t = a
  for (const [i, kind] of kinds.entries()) {
    const m = fxMove(kind, t, cx, W)
    if (t < m.dur) return { kind, t, m, part: i }
    t -= m.dur
  }
  return null
}

const lerp = (a: number, b: number, k: number) => Math.round(a + (b - a) * Math.max(0, Math.min(1, k)))
const wrapX = (p: number, W: number) => ((p + SPRITE_W) % (W + SPRITE_W) + W + SPRITE_W) % (W + SPRITE_W) - SPRITE_W

/** Coreografia do encontro no tick `a`; null quando acabou. */
export function meet(kind: MeetKind, a: number, cx: number, W: number) {
  const right = Math.max(0, W - SPRITE_W)
  let host = { x: cx, flip: false, hop: 0, alt: false }
  let guest = { x: W + 2, flip: true, hop: 0, alt: false }
  let clash: number | undefined
  let talk: { who?: 'guest'; line: 0 | 1; since: number } | undefined
  if (kind === 'chase') {
    // fantasma persegue o Pac-Man pra fora; ele volta com a pastilha de poder e o fantasma foge azul
    if (a < 28) {
      host = { x: cx - 2 * a, flip: true, hop: 0, alt: false }
      guest = { x: W - 2 * a + 6, flip: true, hop: 0, alt: false }
    } else {
      const b = a - 28
      host = { x: Math.min(cx, -SPRITE_W - 16 + 2 * b), flip: false, hop: 0, alt: false }
      guest = { x: -SPRITE_W + 2 * b, flip: false, hop: 0, alt: true }
      if (host.x === cx && guest.x > W) return null
    }
    if (a >= 1 && a < 9) talk = { line: 0, since: a - 1 }
    if (a >= 34 && a < 42) talk = { line: 1, since: a - 34 }
    return { host, guest, clash, talk }
  }
  // entrada: anfitrião vai pra esquerda, convidado entra pela direita, os dois se encaram
  if (a < 6) {
    host = { x: lerp(cx, 0, (a + 1) / 6), flip: true, hop: 0, alt: false }
    guest = { x: lerp(W + 2, right, (a + 1) / 6), flip: true, hop: 0, alt: false }
  } else {
    host = { x: 0, flip: false, hop: 0, alt: false }
    guest = { x: right, flip: true, hop: 0, alt: false }
  }
  if (a >= 6 && a < 14) talk = { line: 0, since: a - 6 }
  if (a >= 14 && a < 22) talk = { who: 'guest', line: 1, since: a - 14 }
  const b = a - 22
  if (kind === 'race' && b >= 0) {
    // os dois correm pra direita, dão a volta na tela; o convidado é mais rápido
    const lap = W + SPRITE_W
    const gp = Math.min(right + lap, right + 4 * b)
    const hp = Math.min(lap, 2 * b)
    guest = { x: wrapX(gp, W), flip: gp === right + lap, hop: gp === right + lap && b % 2 ? 2 : 0, alt: false }
    host = { x: wrapX(hp, W), flip: false, hop: 0, alt: false }
    if (hp === lap) { // terminou: convidado sai, anfitrião volta ao centro
      const c = b - lap / 2
      guest = { x: right + 2 * c, flip: false, hop: 0, alt: false }
      host = { x: Math.min(cx, c), flip: false, hop: 0, alt: false }
      if (host.x === cx && guest.x > W) return null
    }
  }
  if (kind === 'duel' && b >= 0) {
    if (b < 24) { // trocam golpes: cada um avança por vez, faísca no meio
      const k = Math.floor(b / 4)
      const lunge = b % 4 === 1 || b % 4 === 2 ? 3 : 0
      if (k % 2 === 0) host = { ...host, x: lunge, hop: b % 4 === 1 ? 2 : 0 }
      else guest = { ...guest, x: right - lunge, hop: b % 4 === 1 ? 2 : 0 }
      if (b % 4 === 2) clash = Math.floor((host.x + SPRITE_W + guest.x) / 2)
    } else {
      const c = b - 24
      guest = { x: right + 2 * c, flip: false, hop: 0, alt: false }
      host = { x: Math.min(cx, c), flip: false, hop: 0, alt: false }
      if (host.x === cx && guest.x > W) return null
    }
  }
  return { host, guest, clash, talk }
}

export function scene(n: number, seed0: number, names: string[], W: number, force?: Force): Scene {
  const turn = Math.floor(n / TURN)
  const t = n % TURN
  const seed = hash(turn * 31 + seed0)
  // 5 e o número de personagens são coprimos: percorre todos sem repetir em sequência
  const at = (k: number) => ((k * 5 + seed0) % names.length + names.length) % names.length
  const idx = at(turn)
  const right = Math.max(0, W - SPRITE_W)
  const cx = Math.floor(right / 2)
  let x = cx
  let flip = false
  let hop = 0
  let fx: Scene['fx'] = null
  let talk: Talk | null = null
  const encounter = (who: number, a: number, key: string, seedOut: number): Scene | null => {
    const p = partner(names[who]!)
    const m = p && meet(p.kind, a, cx, W)
    if (!p || !m) return null
    const tk: Talk | null = m.talk ? { kind: 'enc', since: m.talk.since, key: `${key}:enc${m.talk.line}`, who: m.talk.who, line: m.talk.line } : null
    return {
      turn, idx: who, seed: seedOut, x: m.host.x, flip: m.host.flip, hop: m.host.hop, fx: null, talk: tk, alt: m.host.alt,
      guest: { name: p.guest, ...m.guest }, clash: m.clash,
    }
  }
  if (force && n > force.at && n - force.at < 200) {
    const a = n - force.at - 1
    if (force.enc) {
      const e = encounter(force.idx, a, `f${force.at}`, 0)
      if (e) return e
    } else {
      // Kirby forçado engole quem estava no palco (ou o anterior, se era ele mesmo)
      const ft = Math.floor(force.at / TURN) // fixo pelo tick do pedido: não troca no meio se virar o turno
      const src = at(ft) === force.idx ? at(ft - 1) : at(ft)
      const mv = moves(names[force.idx]!, names[src]!)
      const r = act(mv.kinds, a, cx, W)
      if (r) {
        return {
          turn, idx: force.idx, seed: 0, x: r.m.x, flip: r.m.flip, hop: r.m.hop, fx: { kind: r.kind, t: r.t, power: force.power },
          talk: a < 10 ? { kind: 'shout', since: a, key: `f${force.at}:shout` } : null,
          alt: altOn(r.kind, r.t, r.m.dur), hat: r.part > 0 ? mv.hat : undefined,
        }
      }
    }
  }
  const plan = seed % 4 // 0 especial, 1 passeio, 2 pulinhos, 3 encontro (quem não tem par dá pulinhos)
  const a = t - ACT_AT
  let alt = false
  let hat: string | undefined
  if (plan === 3 && a >= 0) {
    const e = encounter(idx, a, `${turn}`, seed)
    if (e) return e
  }
  if (plan === 0 && a >= 0) {
    const mv = moves(names[idx]!, names[at(turn - 1)]!)
    const r = act(mv.kinds, a, cx, W)
    if (r) {
      fx = { kind: r.kind, t: r.t }
      ;({ x, hop, flip } = r.m)
      alt = altOn(r.kind, r.t, r.m.dur)
      if (r.part > 0) hat = mv.hat
      if (a < 10) talk = { kind: 'shout', since: a, key: `${turn}:shout` }
    }
  } else if (plan === 1 && a >= 0 && right >= 6) {
    // centro → esquerda → direita → centro
    if (a < cx) { x = cx - a - 1; flip = true }
    else if (a < cx + right) { x = a - cx + 1 }
    else if (a < 2 * right) { x = right - (a - cx - right) - 1; flip = true }
    x = Math.max(0, Math.min(right, x))
  } else if ((plan === 2 || plan === 3) && a >= 0 && a < 24) {
    hop = HOPS[a % 8] ?? 0
  }
  if (!talk && t >= HELLO[0] && t < HELLO[1]) talk = { kind: 'hello', since: t - HELLO[0], key: `${turn}:hello` }
  if (!talk && t >= CHAT[0] && t < CHAT[1]) talk = { kind: 'chat', since: t - CHAT[0], key: `${turn}:chat` }
  return { turn, idx, seed, x, flip, hop, fx, talk, alt, hat }
}

/** Madeline fica de cabelo azul depois do dash; Arthur perde a armadura no fim da lança. */
function altOn(kind: FxKind, t: number, dur: number) {
  return (kind === 'airdash' && t >= 3 && t < dur - 1) || (kind === 'lance' && t >= dur - 6)
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
