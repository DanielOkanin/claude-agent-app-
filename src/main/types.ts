export type PermissionMode = 'default' | 'acceptEdits' | 'bypassPermissions' | 'plan'

export interface StreamingEvent {
  type: 'text_delta' | 'tool_use_start' | 'tool_use_end' | 'complete' | 'error'
  chatId: string
  content?: string
  toolName?: string
  toolInput?: string
  sessionId?: string
  error?: string
}

export interface TerminalSession {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  workingDirectory: string
  model: string
}

export const AVAILABLE_MODELS = [
  { id: 'claude-sonnet-4-6', label: 'Sonnet 4.6', description: 'Fast & capable' },
  { id: 'claude-opus-4-6', label: 'Opus 4.6', description: 'Most intelligent' },
  { id: 'claude-haiku-4-5', label: 'Haiku 4.5', description: 'Fastest' }
]

export const DEFAULT_MODEL = 'claude-opus-4-6'

export interface ElectronAPI {
  createTerminal: (workingDirectory: string, model: string) => Promise<TerminalSession>
  listTerminals: () => Promise<TerminalSession[]>
  deleteTerminal: (id: string) => Promise<void>
  renameTerminal: (id: string, title: string) => Promise<void>
  writeTerminal: (id: string, data: string) => void
  resizeTerminal: (id: string, cols: number, rows: number) => void
  selectDirectory: () => Promise<string | null>
  onTerminalData: (callback: (id: string, data: string) => void) => () => void
  onTerminalExit: (callback: (id: string) => void) => () => void
  onTerminalTitleUpdated: (callback: (id: string, title: string) => void) => () => void
  onNewTerminalShortcut: (callback: () => void) => () => void
}
