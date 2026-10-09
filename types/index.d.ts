export type Todo = { content: string; status: 'pending' | 'in_progress' | 'completed' }
export type Agent = { id: string; type: string; description: string; status: string }
export type Weather = { temp: number | null; desc: string; at: number }
export type Banner = { kind: '' | 'died' | 'done'; at: number }
export type Last = { tool: string; file: string }
export type Snap = {
  model: string
  pct: number
  tokens: number
  window: number
  usd: number
  agents: Agent[]
  startedAt: number
  ponytail: string
}

declare module 'claude-code' {
  interface PluginState {
    'pixel-sidebar': { snap: Snap; todos: Todo[]; tick: number; last: Last; weather: Weather; banner: Banner; gen: string; force: { at: number; idx: number; loud?: boolean; power?: number; enc?: boolean } }
  }
}
