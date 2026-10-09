import { expect, test } from 'claude-code/testing'

import { bubble, scene, SPRITE_W, TURN } from './stage'

const NAMES = ['Mario', 'Link', 'Sonic', 'Crono', 'Tarnished', 'Pac-Man', 'Kirby', 'Mega Man', 'Samus', 'Pikachu', 'Master Chief', 'Goku', 'Ryu', 'Black Mage']

test('balão tem largura fixa, nome na borda e rabinho sob a abertura', async () => {
  const b = bubble('Mario', 'Wahoo! Bora codar agora mesmo!', 99, 24, 10, true)
  for (const l of [b.top, ...b.body, b.bottom]) expect(l.length).toBe(24)
  expect(b.top.startsWith('╭─ Mario ')).toBe(true)
  expect(b.body.at(-1)!.includes('▼')).toBe(true)
  expect(b.bottom.indexOf('╮ ╭') + 1).toBe(b.stem.indexOf('╲'))
})

test('texto surge letra a letra', async () => {
  const b = bubble('Kirby', 'Poyo poyo poyo poyo!', 1, 24, 10, true)
  expect(b.body.join('').replace(/[│ ]/g, '')).toBe('Poyop') // 6 letras = 'Poyo p'
})

test('passeio vai às bordas e todo turno termina no centro', async () => {
  const room = 34
  const center = Math.floor((room - SPRITE_W) / 2)
  let left = false
  let right = false
  for (let n = 0; n < TURN * 12; n++) {
    const s = scene(n, 7, NAMES, room)
    if (!s.fx) expect(s.x >= 0 && s.x <= room - SPRITE_W).toBe(true)
    if (!s.fx && s.x === 0) left = true
    if (!s.fx && s.x === room - SPRITE_W) right = true
    if (n % TURN === TURN - 1) expect(s.x).toBe(center)
  }
  expect(left && right).toBe(true)
})

test('/especial força a especial do personagem escolhido no tick seguinte', async () => {
  const goku = NAMES.indexOf('Goku')
  const s = scene(1001, 7, NAMES, 34, { at: 1000, idx: goku })
  expect(s.idx).toBe(goku)
  expect(s.fx?.kind).toBe('beam')
  expect(s.talk?.kind).toBe('shout')
})
