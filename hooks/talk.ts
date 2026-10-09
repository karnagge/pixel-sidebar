import type { Last, Snap, Todo } from '../types'
import type { FxKind } from './stage'
import { isRain, type Weather } from './world'

// Bordão de entrada.
const HELLO: Record<string, string[]> = {
  Mario: ["It's-a me, Mario!", 'Let’s-a go!', 'Wahoo! Bora codar!', 'Mamma mia, quanto código!'],
  Link: ['Hyaaa!', 'É perigoso ir sozinho! Leve este café.', '(Link abre um baú) ♪ da-da-da-DAAA!', 'Ouça! Hey, listen!'],
  Sonic: ['Rápido demais pra você!', 'Gotta go fast!', 'Bora acelerar esse build?', 'Ei! Cheguei antes do deploy.'],
  Crono: ['…', '(Crono acena em silêncio)', '(Crono concorda com a cabeça)', '(Crono saca a espada)'],
  Tarnished: ['Levante-se, Maculado.', 'Graça encontrada. Descanse um pouco.', 'Tente rolar.', 'Ó, código à frente.'],
  'Pac-Man': ['Waka waka!', 'Comendo bugs um por um.', 'Pronto pra próxima fase.', 'Waka? Waka!'],
  Kirby: ['Poyo!', 'Poyo poyo!', 'Hi! (acena)', 'Poyo? (tá com fome)'],
  'Mega Man': ['Arma nova adquirida!', 'Pronto pra missão!', 'Carregando o Mega Buster…', 'Dr. Wily não terá chance.'],
  Samus: ['Varredura completa.', 'Missão registrada.', 'Nenhum Metroid neste repositório.', 'Energia: 99.'],
  Pikachu: ['Pika pika!', 'Pikachu!', 'Pi-ka? (sei lá o que esse regex faz)', 'Chaaa!'],
  'Master Chief': ['Termine a luta.', 'Eu preciso de uma arma.', 'Pode deixar comigo.', 'Spartans nunca morrem.'],
  Goku: ['Oi, eu sou o Goku!', 'Tô ficando com fome…', 'Esse código tem um poder enorme!', 'Vamos treinar!'],
  Ryu: ['A resposta está no coração da batalha.', 'Oss.', 'Treino é a resposta.', 'Mais um round.'],
  'Black Mage': ['…', '(chapéu ajeitado)', 'Mana cheia.', 'Fogo, gelo ou raio?'],
}

// Grito da especial.
const SHOUT: Record<FxKind, string[]> = {
  coin: ['Moeda!', 'Wahoo! +1 moeda'],
  ring: ['Hyaaa! (giro de espada)', 'Giro de espada!'],
  dash: ['Muito lento!', 'Lá vou eu!'],
  bolt: ['Raio!'],
  roll: ['(rola pra trás)', 'Esquiva!'],
  chomp: ['Nhac nhac nhac!', 'Waka waka waka!'],
  wind: ['Poyo! (inspirando…)', 'Hmmmmmff!'],
  shot: ['Pew pew!', 'Mega Buster!'],
  missile: ['Míssil lançado.', 'Alvo travado.'],
  hadouken: ['Hadouken!', 'HADOUKEN!'],
  grenade: ['Granada!', 'Fogo na área!'],
  beam: ['KAME… HAME… HAAA!', 'KAMEHAMEHAAA!'],
}

const SHOUT_BY: Record<string, string[]> = {
  Pikachu: ['Pikaaa… CHUUU!', 'Pika… CHUUU!'],
  'Black Mage': ['Thundaga!', 'Raio de nível 3!'],
  Crono: ['(Crono ergue a espada) Lightning!'],
}

// Comentário no estilo de cada um.
const QUIRK: Record<string, string[]> = {
  Mario: ['A princesa está em outro repositório.', 'Cano novo: pipeline!'],
  Link: ['Achei uma rupia no meio do diff.', 'Este código pede uma chave pequena.'],
  Sonic: ['Teste lento? Paraleliza!', 'Odeio água e build lento.'],
  Crono: ['(Crono olha para o diff, pensativo)', '(Crono sorri para o teste verde)'],
  Tarnished: ['Cuidado: merge à frente.', 'Tente refatorar, mas com cautela.', 'Ah, um bug. Tente dois-mãos.'],
  'Pac-Man': ['Fantasma? É só um warning.', 'Fui comer uns imports não usados.'],
  Kirby: ['Engoli o bug. Agora tenho o poder dele.', 'Poyo! (copiou: refatorar)'],
  'Mega Man': ['Habilidade copiada: Ctrl+Z!', 'Boss derrotado. Próxima fase!'],
  Samus: ['Escaneando dependências…', 'Ponto de save à vista: git commit.'],
  Pikachu: ['Pika! (tradução: roda os testes)', 'Pi-ka-chu! (tradução: faz commit)'],
  'Master Chief': ['Achei esse bug. Vou terminar a luta.', 'Cortana diria pra ler os logs.'],
  Goku: ['Seu poder de código está acima de 8000!', 'Bora mais um treino de refatoração?'],
  Ryu: ['O verdadeiro oponente é você mesmo… e o linter.', 'Disciplina: um commit por vez.'],
  'Black Mage': ['Magia de nível 3: git bisect.', 'Sem mana pra sexta-feira.'],
}

const MOTIVA = [
  'Commit pequeno é commit feliz.', 'Um passo de cada vez. Tá indo bem!',
  'Código simples hoje, menos plantão amanhã.', 'Erro é só o compilador te ajudando.',
  'Respira. O bug tem medo de quem tem calma.', 'Bebeu água hoje?',
  'Teste verde é a melhor sensação do mundo.', 'Você já resolveu coisa pior que isso.',
  'Feito é melhor que perfeito.', 'Alonga as costas, campeão.',
]

const PIADA = [
  'Funciona na minha máquina. Vamos mandar a máquina?', 'Não é bug, é feature não documentada.',
  'Existem 10 tipos de pessoas: as que entendem binário e as que não.',
  'Cache e nomear coisas: os dois problemas difíceis. E off-by-one.',
  'O código mais rápido é o que não roda.', 'git push --force: coragem ou desespero?',
  'Debugar é ser o detetive de um crime que você mesmo cometeu.',
  '99 bugs no código… corrige um… 127 bugs no código.',
  'Regex resolve um problema. Agora você tem dois.',
  'Documentação é como piada: se precisa explicar, não é boa.',
]

const base = (p: string) => p.split('/').pop() ?? p
const days = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / 86400000)

function quando(now: Date): string[] {
  const out: string[] = []
  const h = now.getHours()
  const dow = now.getDay()
  if (h < 5) out.push('Madrugada codando? Respeito. Mas dorme, hein.')
  else if (h < 12) out.push(h < 9 ? 'Bom dia! Café já tomado?' : 'Bom dia! Manhã produtiva, hein.')
  else if (h < 14) out.push('Já almoçou? Código com fome sai torto.')
  else if (h < 18) out.push(h >= 17 ? 'Quase hora de ir embora…' : 'Boa tarde! Hora do cafezinho?')
  else out.push('Boa noite! Hora extra ou paixão?')
  if (dow === 1) out.push('Segunda-feira. Força, guerreiro.')
  if (dow === 5) out.push(h >= 14 ? 'Sextou! Nada de deploy em produção, hein.' : 'Sexta-feira! Segura o deploy até segunda.')
  if (dow === 0 || dow === 6) out.push('Trabalhando no fim de semana? Hmm…')
  // datas especiais
  const y = now.getFullYear()
  const d0 = new Date(y, now.getMonth(), now.getDate())
  if (days(new Date(y, 0, 1), d0) === 255) out.push('Dia do Programador! 256º dia do ano, claro.')
  if (dow === 5 && now.getDate() === 13) out.push('Sexta-feira 13: nada de rm -rf hoje.')
  const kids = days(d0, new Date(y, 9, 12))
  if (kids === 0) out.push('Dia das Crianças! Hoje vale jogar um pouquinho.')
  else if (kids > 0 && kids <= 5) out.push(`Dia das Crianças em ${kids} dia${kids > 1 ? 's' : ''}!`)
  if (now.getMonth() === 9 && now.getDate() === 31) out.push('Halloween: cuidado com os bugs fantasmas.')
  if (now.getMonth() === 11 && now.getDate() === 25) out.push('Feliz Natal! Deploy hoje só se for presente.')
  if (now.getMonth() === 0 && now.getDate() === 1) out.push('Feliz Ano Novo! Novo ano, mesmos bugs.')
  return out
}

function clima(w: Weather): string[] {
  if (!w.desc) return []
  const out: string[] = []
  const t = w.temp
  const d = w.desc.toLowerCase()
  if (isRain(w)) out.push('Tá chovendo lá fora. Dia perfeito pra codar.')
  else out.push(t !== null ? `Lá fora: ${t}°C e ${d}.` : `Lá fora: ${d}.`)
  if (t !== null && t >= 30) out.push(`${t}°C! Liga o ar-condicionado e o dark mode.`)
  if (t !== null && t <= 15) out.push('Friozinho, hein? Café quente e código quente.')
  return out
}

function trabalho(s: Snap, t: Todo[], last: Last, mins: number): string[] {
  const out: string[] = []
  const pct = Math.round(s.pct)
  if (pct >= 80) out.push(`Contexto em ${pct}%. Pensa num /compact?`)
  else if (pct > 0 && pct < 15) out.push(`Contexto fresquinho, ${pct}%. Manda ver!`)
  const doing = t.find(x => x.status === 'in_progress')
  const left = t.filter(x => x.status !== 'completed').length
  if (doing) out.push(`Foco: ${doing.content}`)
  if (t.length && !left) out.push('Checklist zerado. Mandou bem!')
  else if (left > 1) out.push(`Faltam ${left} tarefas. Bora!`)
  const live = s.agents.filter(a => a.status === 'running' || a.status === 'waiting').length
  if (live) out.push(`${live} agente${live > 1 ? 's' : ''} trabalhando pra você. Chefe de equipe!`)
  if (s.usd >= 1) out.push(`Já foram US$ ${s.usd.toFixed(2)}. Valendo cada centavo?`)
  if (mins >= 120) out.push(`${Math.floor(mins / 60)}h de sessão. Que tal levantar um pouco?`)
  if (s.ponytail) out.push('Ponytail ligado: menos código, menos bug.')
  if (last.tool === 'Bash') out.push('Terminal pegando fogo!')
  if ((last.tool === 'Edit' || last.tool === 'Write') && last.file) out.push(`Mexendo em ${base(last.file)}. Capricha!`)
  if (last.tool === 'Read' || last.tool === 'Grep') out.push('Lendo o código com calma. Gosto disso.')
  if (last.tool === 'Agent') out.push('Delegou, é? Estilo gerente.')
  return out
}

const pick = <T>(xs: T[], seed: number) => xs[Math.abs(seed) % xs.length]!

export type World = { s: Snap; t: Todo[]; last: Last; mins: number; now: Date; weather: Weather }

/** Escolhe a fala. Chamar uma vez por janela de fala e guardar: as entradas mudam a cada tool call. */
export function say(kind: 'hello' | 'chat' | 'shout', name: string, fx: FxKind | null, seed: number, w: World): string {
  if (kind === 'hello') return pick(HELLO[name] ?? ['Olá!'], seed)
  if (kind === 'shout') return pick(SHOUT_BY[name] ?? SHOUT[fx ?? 'coin'], seed)
  if (w.s.pct >= 80) return trabalho(w.s, w.t, w.last, w.mins)[0]! // alerta de contexto tem prioridade
  const work = trabalho(w.s, w.t, w.last, w.mins)
  const pools = [work, quando(w.now), clima(w.weather), QUIRK[name] ?? [], PIADA, MOTIVA].filter(p => p.length)
  return pick(pick(pools, seed), seed >> 3)
}

/** Quebra da quarta parede: o que escapa do painel vira toast. */
export function escape(kind: FxKind, name: string, coins: number): string | null {
  switch (kind) {
    case 'coin': return `+1 moeda pro Mario (total: ${coins})`
    case 'dash': return 'Sonic deu uma volta inteira no seu terminal.'
    case 'beam': return 'O Kamehameha atravessou a barra lateral. Seu código está bem?'
    case 'shot': return 'O tiro do Mega Man saiu do painel. Foi mal pelo transcript!'
    case 'missile': return 'Míssil da Samus perdido em algum lugar do terminal.'
    case 'hadouken': return 'Hadouken! Se o prompt tremer, foi o Ryu.'
    case 'bolt': return `${name} conjurou um raio. Lembra de salvar os arquivos!`
    case 'chomp': return 'Pac-Man comeu 3 pontos do seu terminal. Waka.'
    default: return null
  }
}

// Reações a eventos do trabalho: tarefa concluída, pedido de autorização, pausa no fim do turno.
const CHEER: Record<'done' | 'ask' | 'pause' | 'abort', string[]> = {
  done: ['Tarefa concluída: {d}!', 'Missão cumprida: {d}', 'Mais uma! {d}', 'Check! {d}'],
  ask: ['Ei! Preciso da sua autorização aí embaixo.', 'Posso rodar {d}? Dá uma olhada no prompt!', 'Autorização pendente: {d}.'],
  pause: ['Sua vez! Tô esperando.', 'Pronto! Próximo comando?', 'Terminei. O que achou?', 'Pausa pro café? Tô aqui.'],
  abort: ['Opa, interrompido. Tudo bem?', 'Parei! Mudou de ideia?'],
}
const CHEER_BY: Record<string, Partial<Record<keyof typeof CHEER, string[]>>> = {
  Mario: { done: ['Wahoo! Fase concluída: {d}'], pause: ['Let’s-a go? Sua vez!'] },
  Link: { done: ['♪ Da-da-da-DAAA! {d}'], ask: ['Hey! Listen! Autorização pendente!'] },
  Tarnished: { done: ['INIMIGO ABATIDO: {d}'], pause: ['Descanse na Graça. Sua vez.'] },
  Samus: { done: ['Missão completa: {d}'], ask: ['Aguardando ordens: {d}.'] },
  Goku: { done: ['Treino concluído! {d}'], pause: ['Ufa! Bora mais um round?'] },
  'Mega Man': { done: ['Boss derrotado: {d}!'] },
  Pikachu: { ask: ['Pika?! (aprova aí: {d})'], done: ['Pika pika! ({d})'] },
  Crono: { pause: ['(Crono olha pra você, esperando)'], ask: ['(Crono aponta para o prompt)'] },
  Kirby: { done: ['Poyo! {d}'], pause: ['Poyo? (sua vez)'] },
  'Pac-Man': { done: ['Waka! Comi essa: {d}'] },
  'Master Chief': { done: ['Objetivo concluído: {d}'], ask: ['Aguardando autorização, senhor.'] },
  Ryu: { done: ['Vitória! {d}'] },
  Sonic: { pause: ['Tô parado? Isso é tortura. Sua vez!'] },
  'Black Mage': { ask: ['(segura o feitiço) Autoriza: {d}?'] },
}

export function cheer(why: keyof typeof CHEER, name: string, detail: string, seed: number): string {
  const pool = [...(CHEER_BY[name]?.[why] ?? []), ...CHEER[why]]
  const line = pick(pool, seed).replace('{d}', detail)
  return line.length > 70 ? line.slice(0, 69) + '…' : line
}
