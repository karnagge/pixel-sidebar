// Pixel art estilo SNES: desenho 14x18 + contorno automático = 16x20.
// Maiúscula = material com volume (luz no alto à esquerda: brilho, base, sombra);
// minúscula = detalhe chapado (olho, boca, fivela). '.' vazio.
export type Grid = string[][] // cor hex por pixel, '' = vazio
// alt: variação do mesmo personagem (cabelo azul da Madeline, Arthur de cueca, fantasma assustado)
type Art = {
  name: string; palette: Record<string, string>; a: string[]; b: Record<number, string>; outline?: string
  alt?: { palette?: Record<string, string>; rows?: Record<number, string> }
}

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
  { // Sans (Undertale)
    name: 'Sans',
    palette: { W: '#eeeeee', B: '#3a6ad0', F: '#d8dce4', K: '#2a2a34', P: '#f08ab0', k: '#111111', w: '#ffffff', c: '#5fd8ff' },
    a: [
      '...WWWWWWWW...', '..WWWWWWWWWW..', '.WWWWWWWWWWWW.', '.WWkkWWWWkkWW.',
      '.WWkwWWWWkwWW.', '.WWWWWkkWWWWW.', '..WkkkkkkkkW..', '..WWkWkWkWWW..',
      '...WWWWWWWW...', '.FFBBBBBBBBFF.', 'BBBBBBBBBBBBBB', 'BBBBBBkkBBBBBB',
      'WBBBBBkkBBBBBW', '.BBBBBkkBBBBB.', '..KKKKKKKKKK..', '..KKKK..KKKK..',
      '...WW....WW...', '..PPPP..PPPP..'],
    b: { 4: '.WWkkWWWWkcWW.', 12: '.BBBBBkkBBBBB.', 13: 'WBBBBBkkBBBBBW' },
  },
  ninja('Scorpion', '#e8c020', '#26262c', '#ffffff'),
  ninja('Sub-Zero', '#3a7ae0', '#1e2440', '#e8f6ff'),
  { // MissingNo. (Pokémon)
    name: 'MissingNo.',
    palette: { a: '#9a8ab0', b: '#4a4060', c: '#7ad0c0', w: '#e8e8f0', k: '#1b1b1b' },
    a: [
      '.......wbkaaa.', '.......wabaak.', '.......kabaka.', '.......abakab.', '.......abckba.',
      '.......cbabwa.', '.aabkkwkkwcbb.', '.backwkcaakbw.', '.bkkaawwwkkaa.', '.ckaackckwakw.',
      '.bakabcbbkkka.', '.bkkcbkckwkbb.', '.abbbbakbccab.', '.kwwbakkkkkak.', '.kababkbawaaa.',
      '.bawaabkbcwwk.', '.aakkkkcabawc.', '.kbabwbacacwb.'],
    b: {
      0: '.......bwkbba.', 2: '.......kkkkkb.', 4: '.......kkkaca.', 6: '.bakbbaakbbkk.', 8: '.wcabwbacwbca.',
      10: '.caakwbkbbkkk.', 12: '.ababwkacwwwa.', 14: '.bkkbkaakbkak.', 16: '.awkabbwkbacc.',
    },
  },
  { // Navi (Zelda)
    name: 'Navi',
    palette: { L: '#9fdcff', w: '#ffffff', v: '#d8f0ff' },
    outline: '#3a6a9a',
    a: [
      '..............', '..............', '..............', '..............', '..............',
      '..vv......vv..', '.vvvv....vvvv.', '.vvvvLLLLvvvv.', '..vvLLwwLLvv..', '...LLwwwwLL...',
      '...LLwwwwLL...', '..vvLLwwLLvv..', '.vvv.LLLL.vvv.', '..v........v..', '..............',
      '..............', '..............', '..............'],
    b: {
      4: '..............', 5: '..............', 6: '...v......v...', 7: '..vvvLLLLvvv..', 8: '...vLLwwLLv...',
      9: '...LLwwwwLL...', 10: '...LLwwwwLL...', 11: '..vvLLwwLLvv..', 12: '.vvvvLLLLvvvv.', 13: '..vv......vv..',
    },
  },
  { // Cachorro do Duck Hunt
    name: 'Duck Hunt',
    palette: { N: '#b07a3a', T: '#ecc890', E: '#6a3a1a', W: '#f4f4f4', k: '#1b1b1b', m: '#d8505a' },
    a: [
      '..............', '....NNNNN.....', '...NNNNNNN....', '..ENNNNkNNN...', '.EENNNNNNTTTk.',
      '.EENNNNNTTTTT.', '.EEENNNNTmmmT.', '..EE.NNNNTTT..', '..EE.NNNNN....', '....WWNNNNN...',
      '...WWWNNNNNN..', '..NWWWNNNNNN..', '..NWWWNNNNNNN.', '...WWNNNNNNN..', '...NNN..NNN...',
      '...NNN..NNN...', '..TTTT..TTTT..', '.TTTTT..TTTTT.'],
    b: { 4: '.EENNNNNNTTTk.', 5: '.EENNNNNTmmmT.', 6: '.EEENNNNTmmmT.', 11: '..NWWWNNNNNNT.', 12: '..NWWWNNNNNNT.' },
  },
  { // Creeper (Minecraft)
    name: 'Creeper',
    palette: { G: '#5ab84a', g: '#3a8a32', l: '#8ad87a', k: '#141414' },
    a: [
      '..GGGGGGGGGG..', '..GlGGgGGlGG..', '..GkkGGGGkkG..', '..GkkGGgGkkG..', '..GGgGkkGGGG..',
      '..GGGkkkkgGG..', '..GlGkkkkGGG..', '..GGGkGGkGlG..', '....GGgGGG....', '....GlGGGG....',
      '....GGGGgG....', '....GgGGGG....', '....GGGlGG....', '....GGGGGG....', '..GGGG..GGGG..',
      '..GgGG..GGlG..', '..GGGG..GgGG..', '..GGGG..GGGG..'],
    b: { 14: '...GGGGGGGG...', 15: '...GgGG.GGlG..', 16: '..GGGG...GgGG.', 17: '..GGGG...GGGG.' },
  },
  { // Simon Belmont (Castlevania)
    name: 'Simon',
    palette: { H: '#c87a3a', S: '#f6c79c', A: '#7a5a3a', D: '#4a3a2a', M: '#b8b8c0', k: '#1b1b1b', m: '#c47a5a', y: '#f6d33a' },
    a: [
      '...HHHHHH.....', '..HHHHHHHH....', '.HHHHHHHHHH...', '.HHSSSSSSHH...', '.HHSkSSkSSH...',
      '..HSSSSSSS....', '...SSmmSS.....', '..AAASSAAA....', '.AAAAAAAAAA...', 'SAAAAAAAAAAS..',
      'S.AAAyyAAA.SM.', '..AAAAAAAA..M.', '..AAAA.AAAA.M.', '..SSS...SSS.MM', '..SSS...SSS...',
      '..DDD...DDD...', '.DDDD..DDDD...', '.DDDDD.DDDDD..'],
    b: { 13: '...SSS.SSS..MM', 14: '...SSS.SSS....', 15: '...DDD.DDD....', 16: '..DDDD.DDDD...', 17: '..DDDDDDDDDD..' },
  },
  { // Bomberman
    name: 'Bomberman',
    palette: { W: '#f4f4f4', p: '#ff6fa0', S: '#f6c79c', k: '#1b1b1b', B: '#3a5ad8', P: '#e05a9a', y: '#f6d33a' },
    a: [
      '......pp......', '......pp......', '.......W......', '....WWWWWW....', '...WWWWWWWW...',
      '..WWSSSSSSWW..', '..WSSkSSkSSW..', '..WSSkSSkSSW..', '..WWSSSSSSWW..', '...WWWWWWWW...',
      '..WBBBBBBBBW..', '.WWBBByyBBBWW.', '.WWBBBBBBBBWW.', '...BBBBBBBB...', '...BBB..BBB...',
      '...BBB..BBB...', '..PPPP..PPPP..', '.PPPPP..PPPPP.'],
    b: { 0: '.....pp.......', 1: '.....pp.......', 14: '....BBBBBB....', 15: '....BBB.BBB...', 16: '...PPPP.PPPP..', 17: '..PPPPP.PPPPP.' },
  },
  { // Donkey Kong
    name: 'Donkey Kong',
    palette: { N: '#7a4a24', T: '#e8b47a', R: '#d8302a', k: '#1b1b1b', m: '#7a2a1a', y: '#f6d33a' },
    a: [
      '....NNNNNN....', '...NNNNNNNN...', '..NNNNNNNNNN..', '..NTTkTTkTTN..', '..NTTTTTTTTN..',
      '.NNTTTkkTTTNN.', '.NNTTTTTTTTNN.', 'NNNNTTmmTTNNNN', 'NNNNNRRRRNNNNN', 'NNNNTRyyRTNNNN',
      'TTNNTTRRTTNNTT', 'TTNNTTRRTTNNTT', 'TT.NNTTTTNN.TT', '...NNNNNNNN...', '..NNNN..NNNN..',
      '..NNN....NNN..', '.TTTT....TTTT.', '.TTTTT..TTTTT.'],
    b: { 10: '.TNNTTRRTTNNT.', 11: 'TTNNTTRRTTNNTT', 12: 'TTTNNTTTTNNTTT', 15: '...NNN..NNN...', 16: '..TTTT..TTTT..', 17: '.TTTTT..TTTTT.' },
  },
  { // Yoshi
    name: 'Yoshi',
    palette: { G: '#4ac040', W: '#f4f4f4', R: '#e0302a', O: '#f08a24', k: '#1b1b1b', w: '#ffffff', r: '#e0302a' },
    a: [
      '.......GGG....', '....r.GGGGGG..', '...r.GwwGGGGG.', '..r..GwkGGGGGG', '.....GGGGGGGGG',
      '....GGGGGWWWW.', '...RRGGGWWW...', '..RRRRGGWW....', '.GRRRRGGWWG...', 'GGGRRGGWWWGG..',
      'GG.GGGGWWWG...', '...GGGGWWW....', '...GGGGGGG....', '...GGG.GGG....', '...GGG.GGG....',
      '..OOOO.OOOO...', '.OOOOO.OOOOO..', '..............'],
    b: { 13: '....GGGGGG....', 14: '....GGG.GGG...', 15: '...OOOO.OOOO..', 16: '..OOOOO.OOOOO.' },
  },
  { // Guile (Street Fighter)
    name: 'Guile',
    palette: { H: '#f0d050', S: '#f6c79c', G: '#5a7a3a', C: '#7a8a4a', D: '#3a3a3a', k: '#1b1b1b', m: '#c47a5a' },
    a: [
      '..HHHHHHHHH...', '..HHHHHHHHH...', '..HHHHHHHHH...', '..HSSSSSSSH...', '..SSkSSSkSS...',
      '..SSSSSSSSS...', '...SSmmmSS....', '.SSSSSSSSSSS..', 'SSSGGGGGGGSSS.', 'SS.GGGGGGG.SS.',
      'SS.GGGGGGG.SS.', '...DDDDDDD....', '...CCCCCCC....', '...CCC.CCC....', '...CCC.CCC....',
      '...CCC.CCC....', '..DDDD.DDDD...', '.DDDDD.DDDDD..'],
    b: { 9: 'SS.GGGGGGG.SS.', 10: '.S.GGGGGGG.S..', 13: '..CCC...CCC...', 14: '..CCC...CCC...', 15: '..CCC...CCC...', 16: '.DDDD...DDDD..', 17: 'DDDDD...DDDDD.' },
  },
  { // Cloud (Final Fantasy VII)
    name: 'Cloud',
    palette: { H: '#f0d060', S: '#f6c79c', P: '#5a4a90', D: '#3a3050', A: '#a8b0bc', N: '#7a4a24', k: '#1b1b1b', m: '#c47a5a' },
    a: [
      '..H.H.H.....A.', '.HHHHHHH...AA.', 'HHHHHHHHH..AA.', '.HHSSSSHH..AA.', 'HHSkSSkSH..AA.',
      '..SSSSSS...AA.', '...SSmS....AA.', '..PPPPPPP..AA.', '.PPPPPPPPP.AA.', 'SPPPPPPPPPSAA.',
      'S.PPNNNPP.SNN.', '..DDDDDDD..NN.', '..DDDDDDD.....', '..DDD.DDD.....', '..DDD.DDD.....',
      '..DDD.DDD.....', '.NNNN.NNNN....', '.NNNNN.NNNNN..'],
    b: { 0: '.H.H.H......A.', 13: '..DDD..DDD....', 14: '..DDD..DDD....', 15: '..DDD..DDD....', 16: '.NNNN..NNNN...', 17: 'NNNNN..NNNNN..' },
  },
  { // Kratos (God of War)
    name: 'Kratos',
    palette: { S: '#e4dcd2', R: '#c8302a', D: '#3a2a20', L: '#8a5a3a', A: '#b0b0b8', k: '#1b1b1b' },
    a: [
      '...SSSSSS.....', '..SSSRSSSS....', '..SSSRSSSS....', '..SkSRSkSS....', '..SSSRSSSS....',
      '..SSDDDDSS....', '...SDDDDS.....', '..SSRSSSSSS...', '.SSSRSSSSSSS..', 'SSSSRSSSSSSSS.',
      'SS.SRRSSSSS.S.', 'AA.LLLLLLLL.AA', 'AA.LLLLLLLL.AA', '...SSS..SSS...', '...SSS..SSS...',
      '...SSS..SSS...', '..DDDD..DDDD..', '.DDDDD..DDDDD.'],
    b: { 10: 'SS.SRRSSSSS.SS', 11: 'AA.LLLLLLLL.AA', 12: '.A.LLLLLLLL.A.', 16: '..DDDD...DDDD.', 17: '.DDDDD...DDDDD' },
  },
  { // Madeline (Celeste)
    name: 'Madeline',
    palette: { R: '#d8303a', S: '#f6c79c', B: '#5a4ab0', N: '#7a4a24', D: '#4a3a2a', k: '#1b1b1b', m: '#c47a5a' },
    a: [
      '..............', '..............', '...RRRRRR.....', '..RRRRRRRR....', '.RRRSSSSSRR...',
      'RRRSkSSkSR....', 'RRRSSSSSSR....', 'RRR.SSmSS.....', '.RR.BBBBBB....', '...BBBBBBBB...',
      '..SBBBBBBBBS..', '..SBBBBBBBBS..', '....BBBBBB....', '....NNNNNN....', '....NN..NN....',
      '....NN..NN....', '...DDD..DDD...', '..DDDD..DDDD..'],
    b: { 5: '.RRSkSSkSR....', 6: 'RRRSSSSSSR....', 7: '.RR.SSmSS.....', 8: '..R.BBBBBB....', 14: '...NN...NN....', 15: '...NN...NN....', 16: '..DDD...DDD...', 17: '.DDDD...DDDD..' },
    alt: { palette: { R: '#4ab0f0' } },
  },
  { // Space Invader
    name: 'Invader',
    palette: { g: '#5adc5a' },
    a: [
      '..............', '..............', '..............', '..............', '..............',
      '...g.....g....', '....g...g.....', '...ggggggg....', '..gg.ggg.gg...', '.ggggggggggg..',
      '.g.ggggggg.g..', '.g.g.....g.g..', '....gg.gg.....', '..............', '..............',
      '..............', '..............', '..............'],
    b: {
      5: '...g.....g....', 6: '.g..g...g..g..', 7: '.g.ggggggg.g..', 8: '.ggg.ggg.ggg..', 9: '.ggggggggggg..',
      10: '..ggggggggg...', 11: '...g.....g....', 12: '..g.......g...',
    },
  },
  { // Arthur (Ghosts'n Goblins)
    name: 'Arthur',
    palette: { A: '#b8c0cc', R: '#e0302a', D: '#5a6070', S: '#f6c79c', H: '#7a4a24', k: '#1b1b1b', m: '#c47a5a', w: '#f4f4f4', r: '#e0302a' },
    a: [
      '.....RRR......', '....RRRRR.....', '...AAAAAAA....', '..AAAAAAAAA...', '..AAkkkkkAA...',
      '..AAAAAAAAA...', '...AAAAAAA....', '..DAAAAAAAD...', '.AAAAAAAAAAA..', 'AAAAAAAAAAAAA.',
      'AA.AAAAAAA.AA.', 'SS.DDDDDDD.SS.', '...AAAAAAA....', '...AAA.AAA....', '...AAA.AAA....',
      '...DDD.DDD....', '..AAAA.AAAA...', '.AAAAA.AAAAA..'],
    b: { 13: '..AAA...AAA...', 14: '..AAA...AAA...', 15: '..DDD...DDD...', 16: '.AAAA...AAAA..', 17: 'AAAAA...AAAAA.' },
    alt: {
      rows: {
        0: '..............', 1: '..............', 2: '...HHHHHHH....', 3: '..HHHHHHHHH...', 4: '..HSkSSSkSH...',
        5: '..SSSSSSSSS...', 6: '...SSmmmSS....', 7: '....SSSSS.....', 8: '.SSSSSSSSSSS..', 9: 'SSSSSSSSSSSSS.',
        10: 'SS.SSSSSSS.SS.', 11: '.S.wwrwwrww.S.', 12: '...wwwrwwww...', 13: '...SSS.SSS....', 14: '...SSS.SSS....',
        15: '...SSS.SSS....', 16: '..SSSS.SSSS...', 17: '.SSSSS.SSSSS..',
      },
    },
  },
  { // Tripulante (Among Us)
    name: 'Tripulante',
    palette: { R: '#d8303a', V: '#9ad8f0', v: '#ffffff' },
    a: [
      '..............', '..............', '..............', '.....RRRRR....', '....RRRRRRR...',
      '...RRRRVVVVV..', '...RRRVvVVVVV.', '.RRRRRVVVVVVV.', '.RRRRRRVVVVV..', '.RRRRRRRRRRR..',
      '.RRRRRRRRRRR..', '.RRRRRRRRRRR..', '.RRRRRRRRRRR..', '...RRRRRRRR...', '...RRRR.RRRR..',
      '...RRR...RRR..', '...RRR...RRR..', '..............'],
    b: { 14: '...RRRRRRRR...', 15: '..RRR....RRR..', 16: '..RRR....RRR..' },
  },
]

// Fantasma do Pac-Man: só aparece no encontro, não entra no rodízio.
const EXTRA_ARTS: Art[] = [
  {
    name: 'Blinky',
    palette: { R: '#e0302a', w: '#ffffff', b: '#2a4ad8' },
    a: [
      '..............', '..............', '..............', '..............', '..............',
      '..............', '.....RRRR.....', '...RRRRRRRR...', '..RRRRRRRRRR..', '..RRwwRRRwwR..',
      '.RRRwbbRRwbbR.', '.RRRwbbRRwbbR.', '.RRRRwwRRRwwR.', '.RRRRRRRRRRRR.', '.RRRRRRRRRRRR.',
      '.RRRRRRRRRRRR.', '.RR.RRR.RRR.R.', '.R...R...R....'],
    b: { 16: '.R.RRR.RRR.RR.', 17: '....R...R...R.' },
    alt: { palette: { R: '#2a3ad8', b: '#2a3ad8', w: '#f4c0a0' } },
  },
]

/** Os dois ninjas do Mortal Kombat: mesmo corpo, outra cor. */
function ninja(name: string, cloth: string, dark: string, eye: string): Art {
  return {
    name,
    palette: { Y: cloth, D: dark, w: eye, r: '#c8a040' },
    a: [
      '....YYYYYY....', '...YYYYYYYY...', '..YYYYYYYYYY..', '..YYwwYYwwYY..', '..DDDDDDDDDD..',
      '..YDDDDDDDDY..', '...YYYYYYYY...', '.YYYYDDDDYYYY.', 'YYYYYYDDYYYYYY', 'YYDYYYDDYYYDYY',
      'DD.YYYDDYYYrDD', 'DD.DDDDDDDD.DD', '...YYYYYYYY...', '...YYY..YYY...', '...YYY..YYY...',
      '...DDD..DDD...', '..DDDD..DDDD..', '.DDDDD..DDDDD.'],
    b: { 13: '..YYY...YYY...', 14: '..YYY...YYY...', 15: '..DDD...DDD...', 16: '.DDDD...DDDD..', 17: 'DDDDD...DDDDD.' },
  }
}

export type Sprite = { name: string; frames: [Grid, Grid]; alt?: [Grid, Grid] }

function sprite(art: Art): Sprite {
  const fb = art.a.map((r, i) => art.b[i] ?? r)
  const out: Sprite = { name: art.name, frames: [bake(art, art.a), bake(art, fb)] }
  if (art.alt) {
    const v = { ...art, palette: { ...art.palette, ...art.alt.palette } }
    const rows = art.alt.rows ?? {}
    out.alt = [bake(v, art.a.map((r, i) => rows[i] ?? r)), bake(v, fb.map((r, i) => rows[i] ?? r))]
  }
  return out
}

export const SPRITES: Sprite[] = ARTS.map(sprite)
export const EXTRAS: Sprite[] = EXTRA_ARTS.map(sprite)

/** Cor que mais aparece no sprite (chapéu do Kirby quando copia alguém). */
export function mainColor(s: Sprite): string {
  const count = new Map<string, number>()
  for (const row of s.frames[0]) for (const c of row) if (c && c !== '#1d1a2b') count.set(c, (count.get(c) ?? 0) + 1)
  return [...count].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '#ffffff'
}
