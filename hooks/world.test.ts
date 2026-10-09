import { expect, test } from 'claude-code/testing'

import { SPRITES } from './sprites'
import { BAND_MS, bandGrid } from './band'
import { escapeAt, fxMotion, scene, SPECIAL, TURN, type FxKind } from './stage'
import { cheer, escape, say } from './talk'
import { paint, rows, STAGE_ROWS } from './world'

const NAMES = SPRITES.map(s => s.name)
const W = 34

test('todo personagem tem especial e o palco pinta W x H em qualquer tick', async () => {
  for (const name of NAMES) expect(SPECIAL[name] !== undefined).toBe(true)
  const sunny = { temp: 33, desc: 'Ensolarado', at: 0 }
  for (let n = 0; n < TURN * NAMES.length; n += 3) {
    const sc = scene(n, 1, NAMES, W)
    const g = paint(n, W, sc, SPRITES[sc.idx]!.frames[n % 2]!, new Date(2026, 9, 9, (n / 7) % 24), sunny)
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
