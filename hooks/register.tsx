import { atom, read, update } from 'claude-code'
import type { EngineInterface as Engine, Register } from 'claude-code'

import type { Banner, Last, Snap, Todo } from '../types'
import { SPRITES } from './sprites'
import { BAND_MS, bandGrid } from './band'
import { bubble, escapeAt, scene, SPRITE_W, type Force, type FxKind, type Scene } from './stage'
import { cheer, escape, say } from './talk'
import { cells, merge, paint, stamp, STAGE_ROWS, type Weather } from './world'

const PANE = 'sidebar'
const snap = atom({ plugin: 'pixel-sidebar', key: 'snap' } as const, {
  model: '', pct: 0, tokens: 0, window: 0, usd: 0, agents: [], startedAt: 0, ponytail: '',
} as Snap)
const tick = atom({ plugin: 'pixel-sidebar', key: 'tick' } as const, 0)
const last = atom({ plugin: 'pixel-sidebar', key: 'last' } as const, { tool: '', file: '' } as Last)
const todos = atom({ plugin: 'pixel-sidebar', key: 'todos' } as const, [] as Todo[])
const weather = atom({ plugin: 'pixel-sidebar', key: 'weather' } as const, { temp: null, desc: '', at: 0 } as Weather)
const banner = atom({ plugin: 'pixel-sidebar', key: 'banner' } as const, { kind: '', at: -99 } as Banner)
const force = atom({ plugin: 'pixel-sidebar', key: 'force' } as const, { at: -999, idx: 0 } as Force)
const gen = atom({ plugin: 'pixel-sidebar', key: 'gen' } as const, '')
const NAMES = SPRITES.map(s => s.name)
const lines = new Map<string, string>() // fala fixa por janela (turno:tipo)
let room = 34 // largura do palco, lida no último render
let coins = 0
let band: { kind: FxKind; start: number } | null = null // especial atravessando a tela

const bar = (pct: number, w = 18) => {
  const n = Math.round((Math.min(100, pct) / 100) * w)
  return '█'.repeat(n) + '░'.repeat(w - n)
}
const k = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`)
const mins = (ms: number) => `${Math.floor(ms / 60000)}min`
const SEED = Math.floor(Math.random() * 1000) // ponytail: novo a cada load, ordem dos personagens varia por sessão

/** O personagem do palco reage: fala a linha e solta a especial (no máximo uma a cada ~15s). */
async function react($: Engine, why: 'done' | 'ask' | 'pause' | 'abort', detail: string) {
  try { await reactNow($, why, detail) } catch { /* enfeite: nunca atrapalha o trabalho */ }
}

async function reactNow($: Engine, why: 'done' | 'ask' | 'pause' | 'abort', detail: string) {
  const n = await read($, tick)
  const f = await read($, force)
  if (n - f.at < 22) return
  const idx = scene(n, SEED, NAMES, room, f).idx
  lines.set(`f${n}:shout`, cheer(why, NAMES[idx]!, detail, n))
  await update($, force, () => ({ at: n, idx }))
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'sidebar', description: 'Abre a barra lateral' })
    await $.command.register({
      name: 'especial',
      description: 'Faz o personagem da barra lateral soltar a especial agora',
      argumentHint: '[nome do personagem]',
    })
    const r = await $.ui.open({ id: PANE, title: 'Sessão', columns: 34 })
    if (!r.isPlaced) $.ui.toast('pixel-sidebar: terminal estreito, rode /sidebar ou alargue a janela', { timeoutMs: 8000 })
    // hot reload roda session.start de novo: cada geração cancela os timers da anterior
    const me = String(Math.random())
    await update($, gen, () => me)
    const own = (ms: number, fn: () => Promise<unknown> | unknown) => {
      const tm = $.clock.every(ms, async () => {
        if ((await read($, gen)) !== me) return tm.cancel()
        await fn()
      })
    }
    // ponytail: polling de 2s, trocar por eventos se pesar
    own(2000, async () => {
      const [model, u, agents, home] = await Promise.all([
        $.session.model(), $.session.usage(), $.agent.list(), $.env.get('HOME'),
      ])
      // ponytail: o plugin grava o modo ativo nesse arquivo; ausente = desligado
      const flag = await $.fs.read(`${home}/.claude/.ponytail-active`).catch(() => '')
      await update($, snap, () => ({
        model,
        pct: u.context.percent ?? 0,
        tokens: u.context.tokens ?? 0,
        window: u.context.window,
        usd: u.cost?.usd ?? 0,
        startedAt: u.startedAt,
        ponytail: (flag.split('\n')[0] ?? '').trim() || (flag ? 'full' : ''),
        agents: agents.map(a => ({ id: a.id, type: a.type, description: a.description, status: a.status })),
      }))
    })
    // clima pelo IP, de hora em hora (wttr.in); falhou, o palco segue sem clima
    const fetchWeather = async () => {
      if (Date.now() - (await read($, weather)).at < 3600_000) return
      const r = await $.http.fetch('https://wttr.in/?format=%t|%C&lang=pt').catch(() => null)
      const [t, d] = r?.ok ? r.text.trim().split('|') : []
      if (!d) return
      const temp = Number.parseInt((t ?? '').replace('+', ''), 10)
      await update($, weather, () => ({ temp: Number.isNaN(temp) ? null : temp, desc: d.trim(), at: Date.now() }))
    }
    void fetchWeather()
    own(3600_000, fetchWeather)
    // faixa da tela inteira: ~12 quadros/s só enquanto ela existe
    own(80, () => {
      if (!band) return
      if (Date.now() - band.start > BAND_MS[band.kind]) band = null
      $.ui.invalidate('ui.render')
    })
    // ponytail: redesenha o painel a cada 700ms por causa do palco; subir o intervalo se pesar
    own(700, async () => {
      const n = await update($, tick, x => x + 1)
      const f = await read($, force)
      const sc = scene(n, SEED, NAMES, room, f)
      const forced = n > f.at && n - f.at < 200 && sc.seed === 0 && f.loud === true
      // quarta parede: quando a magia chega à borda do painel, atravessa a tela (faixa acima
      // do prompt) e solta um toast. Metade das especiais naturais; a do /especial sempre.
      const cx = Math.floor((room - SPRITE_W) / 2)
      const reacting = n > f.at && n - f.at < 200 && sc.seed === 0
      if (sc.fx && sc.fx.t === escapeAt(sc.fx.kind, cx, room) && (reacting || sc.seed % 2 === 0)) {
        band = { kind: sc.fx.kind, start: Date.now() }
        if (sc.fx.kind === 'coin') coins++
        const msg = escape(sc.fx.kind, NAMES[sc.idx]!, coins)
        // reações a eventos não soltam toast (seriam a cada turno); o /especial e as naturais sim
        if (msg && (forced || !reacting)) $.ui.toast(msg, { timeoutMs: 5000 })
      }
    })
    return next(e)
  })

  on('command.run', { command: 'sidebar' }, async $ => {
    const r = await $.ui.open({ id: PANE, title: 'Sessão', columns: 34 })
    return { text: r.isPlaced ? 'Barra lateral aberta.' : 'Sem espaço: alargue o terminal (110+ colunas) e rode /sidebar de novo.' }
  })

  on('command.run', { command: 'especial' }, async ($, e) => {
    const n = await read($, tick)
    const want = e.args.trim().toLowerCase()
    const cur = scene(n, SEED, NAMES, room, await read($, force)).idx
    const idx = want ? NAMES.findIndex(x => x.toLowerCase().includes(want)) : cur
    if (idx < 0) return { text: `Não conheço "${e.args.trim()}". Personagens: ${NAMES.join(', ')}.` }
    await update($, force, () => ({ at: n, idx, loud: true }))
    return { text: `${NAMES[idx]} vai soltar a especial!` }
  })

  on('tool.call', { tool: 'TodoWrite' }, async ($, e, next) => {
    const list: Todo[] = e.todos.map(x => ({ content: x.content, status: x.status }))
    const before = (await read($, todos)).filter(x => x.status === 'completed').length
    await update($, todos, () => list)
    if (list.filter(x => x.status === 'completed').length > before) {
      const n = await read($, tick)
      await update($, banner, () => ({ kind: 'done', at: n }))
      const fresh = list.filter(x => x.status === 'completed').at(-1)
      await react($, 'done', fresh?.content ?? 'tarefa')
    }
    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    const file = 'file_path' in e && typeof e.file_path === 'string' ? e.file_path : ''
    await update($, last, () => ({ tool: e.tool, file }))
    const res = await next(e)
    if (e.tool === 'Bash' && 'isError' in res && res.isError) {
      // ponytail: qualquer exit != 0 conta (até grep sem match); no máximo 1 a cada ~4min
      const n = await read($, tick)
      const ev = await read($, banner)
      if (ev.kind !== 'died' || n - ev.at > 340) await update($, banner, () => ({ kind: 'died', at: n }))
    }
    return res
  })

  on('tool.check', async ($, e, next) => {
    const v = await next(e)
    if (v.decision === 'ask') await react($, 'ask', e.tool)
    return v
  })

  on('turn.complete', async ($, e, next) => {
    if (!('agentId' in e && e.agentId)) await react($, e.isAborted ? 'abort' : 'pause', '')
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const b = band
    if (!b || e.props.hasSurvey) return next(e)
    const ms = Date.now() - b.start
    if (ms > BAND_MS[b.kind]) return next(e)
    const { Box, Text } = $.ui.resolve(e)
    const g = bandGrid(b.kind, ms, e.props.bodyColumns)
    const lines = [0, 2].map(y => {
      const segs: { ch: string; fg?: string; bg?: string; text: string }[] = []
      g[y]!.forEach((top, x) => {
        const bot = g[y + 1]![x]!
        const cell = !top && !bot ? { ch: ' ' } : !bot ? { ch: '▀', fg: top } : !top ? { ch: '▄', fg: bot } : { ch: '▀', fg: top, bg: bot }
        const last = segs[segs.length - 1]
        if (last && last.ch === cell.ch && last.fg === cell.fg && last.bg === cell.bg) last.text += cell.ch
        else segs.push({ ...cell, text: cell.ch })
      })
      return <Text wrap="truncate-end">{segs.map(s => s.fg ? <Text color={s.fg} backgroundColor={s.bg}>{s.text}</Text> : <Text>{s.text}</Text>)}</Text>
    })
    return <Box flexDirection="column">{lines}</Box>
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text } = $.ui.resolve(e)
    const s = await read($, snap)
    const t = await read($, todos)
    const n = await read($, tick)
    const w = Math.max(10, (e.props.bodyColumns ?? 30) - 4)
    const live = s.agents.filter(a => a.status === 'running' || a.status === 'waiting')
    const done = t.filter(x => x.status === 'completed').length
    const tone = s.pct >= 85 ? 'error' : s.pct >= 60 ? 'warning' : 'success'
    room = e.props.bodyColumns ?? 30
    const sc: Scene = scene(n, SEED, NAMES, room, await read($, force))
    const sp = SPRITES[sc.idx]!
    const raw = sp.frames[Math.floor(n / 2) % 2]!
    const px = sc.flip ? raw.map(row => [...row].reverse()) : raw
    const now = new Date()
    const wx = await read($, weather)
    // estimativa das linhas dos cartões; sem espaço, some o cartão de agentes vazio pro palco caber
    const cardRows = 5 + 4 + 3 + 3 + Math.max(1, live.length) + 4 + Math.min(t.length, 6)
    const roomy = (e.props.scroll?.bodyRows ?? 99) >= cardRows + STAGE_ROWS
    const canvas = cells(paint(n, room, sc, px, now, wx))
    if (sc.talk) {
      let text = lines.get(sc.talk.key)
      if (!text) {
        const lt = await read($, last)
        text = say(sc.talk.kind, sp.name, sc.fx?.kind ?? null, sc.seed, {
          s, t, last: lt, mins: (Date.now() - s.startedAt) / 60000, now, weather: wx,
        })
        if (lines.size > 30) lines.clear()
        lines.set(sc.talk.key, text)
      }
      const width = Math.min(room, Math.max(18, Math.min(text.length, 26) + 4))
      const head = sc.x + SPRITE_W / 2
      const left = Math.min(Math.max(0, head - Math.floor(width / 2)), room - width)
      const bb = bubble(sp.name, text, sc.talk.since, width, head - left, n % 2 === 0)
      const headRow = Math.floor((STAGE_ROWS * 2 - 3 - 19 - sc.hop) / 2) // linha do topo da cabeça no palco
      const top = headRow - (bb.body.length + 3)
      stamp(canvas, top, left, bb.top, 'line')
      stamp(canvas, top, left + 2, ` ${sp.name} `, '#e8875f', { bold: true })
      bb.body.forEach((l, i) => {
        stamp(canvas, top + 1 + i, left, l, 'line')
        stamp(canvas, top + 1 + i, left + 2, l.slice(2, -2), 'ink', { bold: true })
      })
      stamp(canvas, top + 1 + bb.body.length, left, bb.bottom, 'line')
      stamp(canvas, top + 2 + bb.body.length, left, bb.stem, 'line', { skipSpaces: true })
    }
    const ev = await read($, banner)
    if (n - ev.at < 7) {
      const msg = ev.kind === 'died' ? ' VOCÊ MORREU ' : ' TAREFA CONCLUÍDA '
      stamp(canvas, 3, Math.max(0, Math.floor((room - msg.length) / 2)), msg, ev.kind === 'died' ? '#e04a3a' : '#f0c040', { bold: true })
    }
    const stage = merge(canvas).map(line => (
      <Text wrap="truncate-end">{line.map(seg => <Text color={seg.fg} backgroundColor={seg.bg} bold={seg.bold}>{seg.text}</Text>)}</Text>
    ))
    const card = (title: string, right: string | undefined, body: any) => (
      <Box flexDirection="column" borderStyle="round" borderColor="subtle" paddingX={1}>
        <Box justifyContent="space-between">
          <Text bold color="claude">{title}</Text>
          {right && <Text color="subtle">{right}</Text>}
        </Box>
        {body}
      </Box>
    )
    return (
      <Box flexDirection="column" minHeight={e.props.scroll?.bodyRows} justifyContent="space-between">
        <Box flexDirection="column">
        {card('MODELO', mins(Date.now() - s.startedAt), (
          <Box flexDirection="column">
            <Text bold>{s.model || '…'}</Text>
            {s.ponytail && (
              <Text color={s.ponytail === 'ultra' ? 'warning' : 'success'}>
                [PONYTAIL{s.ponytail === 'full' ? '' : `:${s.ponytail.toUpperCase()}`}]
              </Text>
            )}
          </Box>
        ))}
        {card('CONTEXTO', `${Math.round(s.pct)}%`, (
          <Box flexDirection="column">
            <Text color={tone}>{bar(s.pct, w)}</Text>
            <Text color="subtle">{k(s.tokens)} de {k(s.window)} tokens</Text>
          </Box>
        ))}
        {card('CUSTO', undefined, (
          <Text bold color="success">US$ {s.usd.toFixed(2)}</Text>
        ))}
        {(live.length > 0 || roomy) && card('AGENTES', String(live.length), (
          <Box flexDirection="column">
            {live.length === 0 && <Text color="inactive">nenhum ativo</Text>}
            {live.map(a => (
              <Text color="warning" wrap="truncate">● {a.type} <Text color="subtle">{a.description}</Text></Text>
            ))}
          </Box>
        ))}
        {card('TAREFAS', t.length ? `${done}/${t.length}` : undefined, (
          <Box flexDirection="column">
            {t.length === 0 && <Text color="inactive">sem checklist</Text>}
            {t.length > 0 && <Text color="success">{bar((done / t.length) * 100, w)}</Text>}
            {t.length > 5 && <Text color="inactive">+{t.length - 5} mais</Text>}
            {t.slice(t.length > 5 ? Math.max(0, Math.min(t.findIndex(x => x.status !== 'completed'), t.length - 5)) : 0).slice(0, 5).map(x => (
              <Text
                wrap="truncate"
                color={x.status === 'in_progress' ? 'suggestion' : x.status === 'completed' ? 'inactive' : undefined}
                strikethrough={x.status === 'completed'}
              >
                {x.status === 'completed' ? '✔' : x.status === 'in_progress' ? '▶' : '○'} {x.content}
              </Text>
            ))}
          </Box>
        ))}
        </Box>
        <Box flexDirection="column">{stage}</Box>
      </Box>
    )
  })
}
