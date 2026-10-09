import { expect, test } from 'claude-code/testing'

import { SPRITES } from './sprites'
import { BAND_MS, bandGrid } from './band'
import { escapeAt, fxMotion, scene, SPECIAL, TURN, type FxKind } from './stage'
import { cheer, encLine, escape, say } from './talk'
import { paint, rows, STAGE_ROWS } from './world'

const NAMES = SPRITES.map(s => s.name)
const W = 34

test('todo personagem tem especial e o palco pinta W x H em qualquer tick', async () => {
  for (const name of NAMES) expect(SPECIAL[name] !== undefined).toBe(true)
  const sunny = { temp: 33, desc: 'Ensolarado', at: 0 }
  for (let n = 0; n < TURN * NAMES.length; n += 3) {
    const sc = scene(n, 1, NAMES, W)
    const sp = SPRITES[sc.idx]!
    const g = paint(n, W, { ...sc, fx: sc.fx && { ...sc.fx, power: n % 2 } }, ((sc.alt && sp.alt) || sp.frames)[n % 2]!, new Date(2026, 9, 9, (n / 7) % 24), sunny, {
      guest: sc.guest && SPRITES[0]!.frames[0], hat: sc.hat && '#ff0000',
    })
    expect(g.length).toBe(STAGE_ROWS * 2)
    for (const line of g) expect(line.length).toBe(W)
    expect(rows(g).length).toBe(STAGE_ROWS)
  }
})

test('especiais terminam e não deixam o personagem fora do palco no fim', async () => {
  const kinds = [...new Set(Object.values(SPECIAL))] as FxKind[]
  const cx = Math.floor((W - 16) / 2)
  for (const k of kinds) {
    const m = fxMotion(k, fxMotion(k, 0, cx, W).dur - 1, cx, W)
    expect(m.x >= 0 && m.x <= W - 16).toBe(true)
  }
})

test('fala é determinística para as mesmas entradas', async () => {
  const w = {
    s: { model: '', pct: 30, tokens: 0, window: 0, usd: 0, agents: [], startedAt: 0, ponytail: 'full' },
    t: [], last: { tool: 'Bash', file: '' }, mins: 30, now: new Date(2026, 9, 9, 15), weather: { temp: 33, desc: 'Ensolarado', at: 0 },
  }
  for (let seed = 0; seed < 50; seed++) {
    expect(say('chat', 'Mario', null, seed, w)).toBe(say('chat', 'Mario', null, seed, w))
    expect(say('chat', 'Mario', null, seed, w).length > 0).toBe(true)
  }
  expect(escape('coin', 'Mario', 3)).toBe('+1 moeda pro Mario (total: 3)')
})

test('a especial vaza antes de acabar e a faixa respeita a largura da tela', async () => {
  const cx = Math.floor((W - 16) / 2)
  for (const k of Object.keys(BAND_MS) as FxKind[]) {
    expect(escapeAt(k, cx, W) < fxMotion(k, 0, cx, W).dur).toBe(true)
    for (let ms = 0; ms <= BAND_MS[k]; ms += 100) {
      const g = bandGrid(k, ms, 120)
      expect(g.length).toBe(4)
      for (const row of g) expect(row.length).toBe(120)
      expect(bandGrid(k, ms, 120, 2).length).toBe(6)
    }
  }
})

test('reações: linha com o detalhe, curta, e cada personagem tem algo pra dizer', async () => {
  for (const name of NAMES) for (const why of ['done', 'ask', 'pause', 'abort'] as const) {
    const l = cheer(why, name, 'Revisar o PR', 3)
    expect(l.length > 0 && l.length <= 70).toBe(true)
    expect(l.includes('{d}')).toBe(false)
  }
  expect(cheer('done', 'Fulano', 'Deploy', 0)).toBe('Tarefa concluída: Deploy!')
})

test('todo personagem tem bordão, comentário e especial com toast', async () => {
  const w = {
    s: { model: '', pct: 30, tokens: 0, window: 0, usd: 0, agents: [], startedAt: 0, ponytail: '' },
    t: [], last: { tool: '', file: '' }, mins: 1, now: new Date(2026, 9, 9, 15), weather: { temp: null, desc: '', at: 0 },
  }
  for (const name of NAMES) {
    expect(say('hello', name, null, 1, w) !== 'Olá!').toBe(true)
    expect(say('shout', name, SPECIAL[name]!, 1, w).length > 0).toBe(true)
  }
  for (const k of Object.keys(BAND_MS) as FxKind[]) if (k !== 'roll' && k !== 'ring' && k !== 'wind' && k !== 'grenade') expect(escape(k, 'X', 1) !== null).toBe(true)
  expect(encLine('Guile', 1, 0).length > 0).toBe(true)
})

test('as especiais novas desenham alguma coisa no palco', async () => {
  const kinds = [...new Set(Object.values(SPECIAL))] as FxKind[]
  const cx = Math.floor((W - 16) / 2)
  const sky = { temp: null, desc: '', at: 0 }
  const now = new Date(2026, 9, 9, 12)
  for (const kind of kinds) {
    const name = Object.keys(SPECIAL).find(k => SPECIAL[k] === kind)!
    const sp = SPRITES.find(s => s.name === name)!
    let drew = false
    const dur = fxMotion(kind, 0, cx, W).dur
    for (let t = 0; t < dur; t++) {
      const base = { turn: 0, idx: 0, seed: 0, x: cx, flip: true, hop: 0, talk: null }
      const plain = paint(0, W, { ...base, fx: null }, sp.frames[0], now, sky)
      const g = paint(0, W, { ...base, fx: { kind, t } }, sp.frames[0], now, sky)
      if (g.some((row, y) => row.some((c, x) => c !== plain[y]![x]))) drew = true
    }
    expect(drew).toBe(true)
  }
})
