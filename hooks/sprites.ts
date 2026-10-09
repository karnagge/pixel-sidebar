// Pixel art estilo SNES: desenho 14x18 + contorno automático = 16x20.
// Maiúscula = material com volume (luz no alto à esquerda: brilho, base, sombra);
// minúscula = detalhe chapado (olho, boca, fivela). '.' vazio.
export type Grid = string[][] // cor hex por pixel, '' = vazio
type Art = { name: string; palette: Record<string, string>; a: string[]; b: Record<number, string>; outline?: string }

const mix = (hex: string, to: number, t: number) =>
  '#' + [1, 3, 5].map(i => {
    const c = parseInt(hex.slice(i, i + 2), 16)
    return Math.round(c + (to - c) * t).toString(16).padStart(2, '0')
  }).join('')

function bake(art: Art, rows: string[]): Grid {
  const at = (x: number, y: number) => rows[y]?.[x] ?? '.'
  const W = 14 + 2
  const H = rows.length + 2
  const ink = art.outline ?? '#1d1a2b'
  const grid: Grid = []
  for (let y = -1; y < H - 1; y++) {
    const line: string[] = []
    for (let x = -1; x < W - 1; x++) {
      const k = at(x, y)
      if (k === '.') {
        const edge = [at(x - 1, y), at(x + 1, y), at(x, y - 1), at(x, y + 1)].some(n => n !== '.')
        line.push(edge ? ink : '')
        continue
      }
      const base = art.palette[k]!
      if (k === k.toLowerCase()) { line.push(base); continue }
      const lit = at(x, y - 1) !== k || at(x - 1, y) !== k
      const shade = at(x, y + 1) !== k || at(x + 1, y) !== k
      line.push(lit ? mix(base, 255, 0.3) : shade ? mix(base, 0, 0.35) : base)
    }
    grid.push(line)
  }
  return grid
}

const ARTS: Art[] = [
  { // / Mario
    name: 'Mario',
    palette: {
      R: '#e0302a', N: '#7a4a24', S: '#f6c79c', U: '#2f5fd8', W: '#f4f4f4',
      k: '#1b1b1b', m: '#3b2412', y: '#f6d33a',
    },
    a: [
      '....RRRRR.....', '...RRRRRRRRR..', '...NNNSSkS....', '..NSNSSSkSSS..',
      '..NSNNSSSSmSSS', '..NNSSSSmmmm..', '....SSSSSSS...', '...RRURRRR....',
      '..RRRURRURRR..', '.RRRRUUUURRRR.', '.WWRUyUUyURWW.', '.WWWUUUUUUWWW.',
      '.WWUUUUUUUUWW.', '...UUUUUUUU...', '...UUUU.UUUU..', '...UUU...UUU..',
      '..NNNN...NNNN.', '.NNNNN...NNNNN'],
    b: { 14: '....UUUUUUU...', 15: '....UUU.UUU...', 16: '...NNNN.NNNN..', 17: '..NNNNN.NNNNN.' },
  },
  { // / Link
    name: 'Link',
    palette: {
      G: '#3da64a', Y: '#e9c64a', S: '#f6c79c', N: '#7a4a24', T: '#e6dcc0', B: '#2f6fd8',
      k: '#1b1b1b', m: '#c47a5a', y: '#f6d33a',
    },
    a: [
      '......GG......', '.....GGGG.....', '....GGGGGG....', '...GGGGGGGG...',
      '..GYYYYYYYYG..', 'S.YYSSSSSSYY.S', 'SSYSSkSSkSSYSS', '.SYSSkSSkSSYS.',
      '..YSSSSSSSSY..', '....SSmmSS....', 'BB.GGGGGGGG...', 'BBSGGGGGGGGS..',
      'BBSGNNNyNNGS..', 'BB.GGGGGGGG...', '.B.GGGGGGGG...', '....TT..TT....',
      '...NNN..NNN...', '..NNNN..NNNN..'],
    b: { 15: '.....TTTT.....', 16: '....NNNNNN....', 17: '...NNNN.NNNN..' },
  },
  { // / Sonic
    name: 'Sonic',
    palette: {
      B: '#2a6ee6', S: '#f2c49a', W: '#f8f8f8', R: '#e0302a',
      k: '#111111', g: '#27a04a', n: '#111111', w: '#c9ced8',
    },
    a: [
      '.....BBB......', '...BBBBBBB....', '..BBBBBBBBB...', 'BBBBBBBBWWW...',
      '.BBBBBBWWWWW..', 'BBBBBBBWWgkW..', '.BBBBBBWWgkW..', 'BBBBBBSSSSSSn.',
      '.BBBBBBSSSSS..', 'BBBBBBBBSS....', '..BBBBBBB.....', '...BBSSSBB....',
      '..BBSSSSSBWW..', '..BBBSSSBBWW..', '...BBBBBBB....', '...BBB..BBB...',
      '..RRRRw.RRRRw.', '.RRRRRR.RRRRRR'],
    b: { 15: '....BBBBBB....', 16: '...RRRRwRRRRw.', 17: '..RRRRRRRRRRRR' },
  },
  { // / Crono (Chrono Trigger)
    name: 'Crono',
    palette: {
      R: '#d8352a', W: '#f0f0f0', S: '#f6c79c', B: '#2f5fd8', N: '#6b4420', P: '#d8d2c0',
      k: '#1b1b1b', m: '#c47a5a', y: '#f6d33a',
    },
    a: [
      '.R..R.RR..R...', 'RRR.RRRRR.RRR.', '.RRRRRRRRRRRRR', 'RRRRRRRRRRRRR.',
      '.RRRRRRRRRRRR.', '..WWWWWWWWWW..', '.RSSSSSSSSSSR.', '.RSSkSSSSkSSR.',
      '..SSSSSSSSSS..', '...SSSmmSSS...', '..BBBBBBBBBB..', '.SBBBBBBBBBBS.',
      '.SBBBBBBBBBBS.', '..NNNNyNNNNN..', '..PPPPPPPPPP..', '..PPPP..PPPP..',
      '..NNNN..NNNN..', '.NNNNN..NNNNN.'],
    b: { 15: '...PPPPPPPP...', 16: '...NNNN.NNNN..', 17: '..NNNNN.NNNNN.' },
  },
  { // / Tarnished (Elden Ring)
    name: 'Tarnished',
    palette: {
      Y: '#f0c040', Z: '#8a6a1c', D: '#7a808e', C: '#4a3c34',
      v: '#141414', o: '#ffb347', y: '#f0c040',
    },
    a: [
      '....YYYYYY....', '...Y......Y...', '....YYDDYY....', '.....DDDD.....',
      '....DDDDDD....', '...DDvvvvDD...', '...DvovvovD...', '...DDvvvvDD...',
      '..CDDDDDDDDC..', '.CCDDDDDDDDCC.', 'CCCDDDyDDDDCCC', 'CCCDDDDDDDDCCC',
      'CCCCDDDDDDCCCC', '.CCCCDDDDCCCC.', '.CCCCDDDDCCCC.', '..CCDD..DDCC..',
      '....DD..DD....', '...DDD..DDD...'],
    b: {
      0: '....ZZZZZZ....', 1: '...Z......Z...', 2: '....ZZDDZZ....',
      15: '..CCCDDDDCCC..', 16: '.....DDDD.....', 17: '....DDD.DDD...',
    },
  },
  { // / Pac-Man
    name: 'Pac-Man',
    palette: { Y: '#f6d33a', k: '#1b1b1b', p: '#ffe9c4' },
    a: [
      '..............', '..............', '..............', '..............',
      '.....YYYY.....', '...YYYYYYYY...', '..YYYYYYkYYY..', '.YYYYYYYYYY...',
      '.YYYYYYYY.....', 'YYYYYYY.......', 'YYYYYY.....p..', 'YYYYYYY.......',
      '.YYYYYYYY.....', '.YYYYYYYYYY...', '..YYYYYYYYYY..', '...YYYYYYYY...',
      '.....YYYY.....', '..............'],
    b: {
      7: '.YYYYYYYYYYYY.', 8: '.YYYYYYYYYYYY.', 9: 'YYYYYYYYYYYYYY', 10: 'YYYYYYYYYYYYYY',
      11: 'YYYYYYYYYYYYYY', 12: '.YYYYYYYYYYYY.', 13: '.YYYYYYYYYYYY.',
    },
  },
  { // / Kirby
    name: 'Kirby',
    palette: { P: '#f59ac0', R: '#d8304a', k: '#1b1b1b', b: '#2f5fd8', c: '#ff6f9a', m: '#a3243c' },
    a: [
      '..............', '..............', '..............', '..............',
      '.....PPPP.....', '...PPPPPPPP...', '..PPPPPPPPPP..', '.PPPPPkPkPPPP.',
      '.PPPPPkPkPPPP.', 'PPPPPPbPbPPPPP', 'PPPPcPPPPPcPPP', 'PPPPPPPmPPPPPP',
      '.PPPPPPPPPPPP.', '..PPPPPPPPPP..', '...PPPPPPPP...', '..RRRR..RRRR..',
      '.RRRRR..RRRRR.', '..............'],
    b: { 7: '.PPPPPPPPPPPP.', 8: '.PPPPPkPkPPPP.', 9: 'PPPPPPPPPPPPPP', 15: '...RRRRRRRR...', 16: '..RRRR..RRRR..' },
  },
  { // / Mega Man
    name: 'Mega Man',
    palette: { B: '#2a5ad0', C: '#4fb8f0', S: '#f6c79c', W: '#f8f8f8', k: '#1b1b1b', m: '#c47a5a' },
    a: [
      '.....BBBB.....', '....BBCCBB....', '...BBBCCBBB...', '..BBBBBBBBBB..',
      '..BBSSSSSSBB..', '..BSWkSSkWSB..', '..BSSSSSSSSB..', '...SSSmmSSS...',
      '..CCBBBBBBCC..', '.CCCBBBBBBCCC.', 'BBCCBBBBBBCCBB', 'BB.CBBBBBBC.BB',
      '...BBBBBBBB...', '...CCCCCCCC...', '...CCC..CCC...', '..BBBB..BBBB..',
      '.BBBBB..BBBBB.', 'BBBBBB..BBBBBB'],
    b: { 14: '....CCCCCC....', 15: '...BBBB.BBBB..', 16: '..BBBBB.BBBBB.', 17: '.BBBBBB.BBBBBB' },
  },
  { // / Samus
    name: 'Samus',
    palette: { R: '#c8302a', O: '#f08a2a', Y: '#f2c84a', G: '#3fd070', A: '#a0a8b8' },
    a: [
      '.....RRRR.....', '....RRRRRR....', '...RRGGGGRR...', '...RGGGGGGR...',
      '...RRGGGGRR...', '..YYRRRRRRYY..', '.YYYYRRRRYYYY.', '.YYYYOOOOYYYY.',
      '..OOOOOOOOOAA.', '..OORRRRROAAAA', '..OOOYYYOOAAAA', '...OOOOOO.AA..',
      '...RRRRRR.....', '...OOO.OOO....', '...OOO..OOO...', '...YYY..YYY...',
      '..RRRR..RRRR..', '.RRRRR..RRRRR.'],
    b: { 13: '....OOOOOO....', 14: '....OOO.OOO...', 15: '....YYY.YYY...', 16: '...RRRR.RRRR..', 17: '..RRRRR.RRRRR.' },
  },
  { // / Pikachu
    name: 'Pikachu',
    palette: { Y: '#f6d33a', k: '#1b1b1b', c: '#e0302a', m: '#7a2a1a' },
    a: [
      '.k..........k.', '.kk........kk.', '..YY......YY..', '..YYY....YYY..',
      '...YYYYYYYY...', '..YYYYYYYYYY..', '..YYkYYYYkYY..', '.YcYYYmmYYYcY.',
      '..YYYYYYYYYY..', '...YYYYYYYY..Y', '..YYYYYYYYY.YY', '..YYYYYYYYYYY.',
      '..YYYYYYYYYY..', '...YYYYYYYY...', '...YYYYYYYY...', '...YY....YY...',
      '..YYY....YYY..', '..............'],
    b: { 6: '..YYYYYYYYYY..', 9: '...YYYYYYYY.Y.', 10: '..YYYYYYYYYYY.' },
  },
  { // / Master Chief
    name: 'Master Chief',
    palette: { G: '#5f7f3c', V: '#e0a030', D: '#3a3e46' },
    a: [
      '....GGGGGG....', '...GGGGGGGG...', '..GGVVVVVVGG..', '..GVVVVVVVVG..',
      '..GGVVVVVVGG..', '..GGGGGGGGGG..', '.GGGDDDDDDGGG.', 'GGGGGGGGGGGGGG',
      'GGGGGDDDDGGGGG', 'GG.GGGGGGGG.GG', 'DD.GGGGGGGG.DD', 'DD.DDDDDDDD.DD',
      '...GGGGGGGG...', '...GGG..GGG...', '...DDD..DDD...', '...GGG..GGG...',
      '..GGGG..GGGG..', '.GGGGG..GGGGG.'],
    b: { 13: '....GGGGGG....', 14: '....DDD.DDD...', 15: '....GGG.GGG...', 16: '...GGGG.GGGG..', 17: '..GGGGG.GGGGG.' },
  },
  { // Goku
    name: 'Goku',
    palette: { H: '#3c3c5a', S: '#f6c79c', O: '#f08a24', U: '#2f5fd8', k: '#1b1b1b', m: '#c47a5a' },
    a: [
      '..H..HHH..H...', '.HHH.HHHH.HH..', 'HHHHHHHHHHHHH.', '.HHHHHHHHHHHHH',
      'HHHHSHHHSHHHH.', '.HHSSSSSSSSH..', '..HSkSSSkSSH..', '...SSSSSSSS...',
      '....SSmSSS....', '..OOOUUUUOOO..', '.SOOOOUUOOOOS.', '.SUOOOOOOOOUS.',
      '..UUUUUUUUUU..', '..OOOOOOOOOO..', '..OOOO..OOOO..', '..OOOO..OOOO..',
      '..UUUU..UUUU..', '.UUUUU..UUUUU.'],
    b: { 14: '...OOOOOOOO...', 15: '...OOOO.OOOO..', 16: '...UUUU.UUUU..', 17: '..UUUUU.UUUUU.' },
  },
  { // Ryu
    name: 'Ryu',
    palette: { H: '#4a2c1a', R: '#d8302a', S: '#f6c79c', W: '#eeeeee', b: '#1b1b1b', k: '#1b1b1b', m: '#c47a5a' },
    a: [
      '....HHHHH.....', '...HHHHHHH....', '..RRRRRRRRRRRR', '..HSSSSSSSHR.R',
      '..HSkSSSkSH...', '...SSSSSSS....', '....SSmSS.....', '...WWWSSWWW...',
      '..WWWWSSWWWW..', '.SWWWWWWWWWWS.', '.SWWWWWWWWWWS.', '..bbbbbbbbbb..',
      '..WWWWWWWWWW..', '..WWWW..WWWW..', '..WWWW..WWWW..', '..WWW....WWW..',
      '..SSS....SSS..', '.SSSS....SSSS.'],
    b: { 13: '...WWWWWWWW...', 14: '...WWWW.WWWW..', 15: '...WWW..WWW...', 16: '...SSS..SSS...', 17: '..SSSS..SSSS..' },
  },
  { // Black Mage
    name: 'Black Mage',
    palette: { Y: '#d9b45a', N: '#7a4a24', B: '#2f4fb0', T: '#8a5a2c', v: '#141414', y: '#f6e05a' },
    a: [
      '......YY......', '.....YYYY.....', '....YYYYY.....', '...YYYYYYY....',
      '..YYYYYYYYY...', 'YYNNNNNNNNNNYY', '.YYYYYYYYYYYY.', '...vvvvvvvv.Y.',
      '...vyvvvvyv.T.', '...vvvvvvvv.T.', '..BBBBBBBBBBT.', '.BBBBBBBBBBBT.',
      '.BBBBBBBBBBBT.', '..BBBBBBBBBBT.', '..BBBBBBBBBBT.', '..BBBBBBBBBBT.',
      '...NNN..NNN.T.', '..NNNN..NNNNT.'],
    b: { 16: '....NNNNNN..T.', 17: '...NNNN.NNNNT.' },
  },
]

export const SPRITES: { name: string; frames: [Grid, Grid] }[] = ARTS.map(art => ({
  name: art.name,
  frames: [bake(art, art.a), bake(art, art.a.map((r, i) => art.b[i] ?? r))],
}))
