import * as pty from 'node-pty'
import { homedir } from 'os'

interface TerminalSession {
  id: string
  ptyProcess: pty.IPty
  workingDirectory: string
  inputBuffer: string
  titled: boolean
}

export class TerminalService {
  private terminals = new Map<string, TerminalSession>()
  private onTitleUpdate: ((id: string, title: string) => void) | null = null

  setTitleUpdateHandler(handler: (id: string, title: string) => void): void {
    this.onTitleUpdate = handler
  }

  createTerminal(
    id: string,
    workingDirectory: string,
    model: string,
    resume: boolean,
    onData: (data: string) => void,
    onExit: () => void
  ): void {
    const shell = process.env.SHELL || '/bin/zsh'

    // Build clean env without Claude Code session markers
    const cleanEnv: Record<string, string> = {}
    for (const [key, value] of Object.entries(process.env)) {
      if (key === 'CLAUDECODE' || key === 'CLAUDE_CODE_ENTRY_POINT') continue
      if (value !== undefined) cleanEnv[key] = value
    }
    cleanEnv.HOME = homedir()
    cleanEnv.TERM = 'xterm-256color'
    cleanEnv.COLORTERM = 'truecolor'

    // Launch shell with claude as the initial command (with model flag)
    // When claude exits, the user drops back to a shell
    // Use --session-id for new sessions, --resume for reconnecting
    const claudeCmd = resume
      ? `claude --resume ${id}${model ? ` --model ${model}` : ''}`
      : `claude${model ? ` --model ${model}` : ''} --session-id ${id}`
    const ptyProcess = pty.spawn(shell, ['-l', '-c', `${claudeCmd}; exec $SHELL -l`], {
      name: 'xterm-256color',
      cols: 120,
      rows: 30,
      cwd: workingDirectory,
      env: cleanEnv
    })

    ptyProcess.onData((data) => {
      onData(data)
    })

    ptyProcess.onExit(() => {
      this.terminals.delete(id)
      onExit()
    })

    this.terminals.set(id, {
      id,
      ptyProcess,
      workingDirectory,
      inputBuffer: '',
      titled: false
    })
  }

  write(id: string, data: string): void {
    const session = this.terminals.get(id)
    if (!session) return

    session.ptyProcess.write(data)

    // Auto-title: capture first user message sent to Claude
    if (!session.titled) {
      if (data === '\r' || data === '\n') {
        // Enter pressed — check if buffer has a meaningful message
        const message = session.inputBuffer.trim()
        if (message.length >= 5) {
          session.titled = true
          // Use first line, truncated to ~60 chars
          const firstLine = message.split('\n')[0]
          const title = firstLine.length > 60 ? firstLine.slice(0, 57) + '...' : firstLine
          const dirName = session.workingDirectory.split('/').pop() || ''
          const fullTitle = `${dirName} — ${title}`
          if (this.onTitleUpdate) {
            this.onTitleUpdate(id, fullTitle)
          }
        }
        session.inputBuffer = ''
      } else if (data === '\x7f' || data === '\b') {
        // Backspace
        session.inputBuffer = session.inputBuffer.slice(0, -1)
      } else if (data.length === 1 && data.charCodeAt(0) >= 32) {
        // Printable character
        session.inputBuffer += data
      } else if (data.length > 1 && !data.includes('\x1b')) {
        // Pasted text
        session.inputBuffer += data
      }
    }
  }

  resize(id: string, cols: number, rows: number): void {
    const session = this.terminals.get(id)
    if (session) {
      session.ptyProcess.resize(cols, rows)
    }
  }

  destroy(id: string): void {
    const session = this.terminals.get(id)
    if (session) {
      session.ptyProcess.kill()
      this.terminals.delete(id)
    }
  }

  destroyAll(): void {
    for (const [id] of this.terminals) {
      this.destroy(id)
    }
  }
}
