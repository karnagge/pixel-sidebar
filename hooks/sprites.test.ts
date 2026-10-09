import { expect, test } from 'claude-code/testing'

import { EXTRAS, SPRITES } from './sprites'

test('todo sprite tem 16x20 nos dois quadros, sem cor indefinida', async () => {
  for (const s of [...SPRITES, ...EXTRAS]) for (const g of [...s.frames, ...(s.alt ?? [])]) {
    expect(g.length).toBe(20)
    for (const row of g) {
      expect(row.length).toBe(16)
      for (const c of row) expect(c === '' || /^#[0-9a-f]{6}$/.test(c)).toBe(true)
    }
  }
})

test('o rodízio passa por todos os personagens', async () => {
  // idx = (turno * 5 + seed) % n: só cobre todos se n e 5 forem coprimos
  expect(SPRITES.length % 5 !== 0).toBe(true)
  expect(new Set(SPRITES.map(s => s.name)).size).toBe(SPRITES.length)
})
