import { useEffect, useRef, useCallback, useState } from 'react'
import { Terminal as XTerm } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebglAddon } from '@xterm/addon-webgl'
import { useTerminalStore } from '../stores/chatStore'
import '@xterm/xterm/css/xterm.css'

interface TerminalProps {
  terminalId: string
  isActive: boolean
}

const terminalInstances = new Map<string, { xterm: XTerm; fitAddon: FitAddon }>()

export function getTerminalInstance(id: string) {
  return terminalInstances.get(id)
}

export function TerminalView({ terminalId, isActive }: TerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const attachedRef = useRef(false)

  const getOrCreateTerminal = useCallback(() => {
    let instance = terminalInstances.get(terminalId)
    if (!instance) {
      const xterm = new XTerm({
        cursorBlink: true,
        cursorStyle: 'bar',
        fontSize: 13,
        fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', Menlo, Monaco, 'Courier New', monospace",
        lineHeight: 1.35,
        letterSpacing: 0,
        theme: {
          background: '#0f172a',
          foreground: '#e2e8f0',
          cursor: '#93c5fd',
          cursorAccent: '#0f172a',
          selectionBackground: '#334155',
          selectionForeground: '#e2e8f0',
          black: '#1e293b',
          red: '#f87171',
          green: '#4ade80',
          yellow: '#facc15',
          blue: '#60a5fa',
          magenta: '#c084fc',
          cyan: '#22d3ee',
          white: '#e2e8f0',
          brightBlack: '#475569',
          brightRed: '#fca5a5',
          brightGreen: '#86efac',
          brightYellow: '#fde047',
          brightBlue: '#93c5fd',
          brightMagenta: '#d8b4fe',
          brightCyan: '#67e8f9',
          brightWhite: '#f8fafc'
        },
        allowTransparency: false,
        scrollback: 10000,
        convertEol: true
      })

      const fitAddon = new FitAddon()
      xterm.loadAddon(fitAddon)

      xterm.onData((data) => {
        window.api.writeTerminal(terminalId, data)
      })

      instance = { xterm, fitAddon }
      terminalInstances.set(terminalId, instance)
    }
    return instance
  }, [terminalId])

  useEffect(() => {
    if (!isActive || !containerRef.current) return

    const instance = getOrCreateTerminal()
    const { xterm, fitAddon } = instance

    if (!attachedRef.current || xterm.element?.parentElement !== containerRef.current) {
      containerRef.current.innerHTML = ''
      xterm.open(containerRef.current)

      try {
        const webglAddon = new WebglAddon()
        xterm.loadAddon(webglAddon)
        webglAddon.onContextLoss(() => {
          webglAddon.dispose()
        })
      } catch {
        // WebGL not available, canvas renderer works fine
      }

      attachedRef.current = true
    }

    requestAnimationFrame(() => {
      fitAddon.fit()
      const dims = fitAddon.proposeDimensions()
      if (dims) {
        window.api.resizeTerminal(terminalId, dims.cols, dims.rows)
      }
    })

    xterm.focus()

    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        fitAddon.fit()
        const dims = fitAddon.proposeDimensions()
        if (dims) {
          window.api.resizeTerminal(terminalId, dims.cols, dims.rows)
        }
      })
    })
    resizeObserver.observe(containerRef.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [isActive, terminalId, getOrCreateTerminal])

  const [isDragOver, setIsDragOver] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Listen for drag events on the document to detect files being dragged over the window
  useEffect(() => {
    if (!isActive) return

    let enterCount = 0

    const handleDragEnter = (e: DragEvent) => {
      if (!e.dataTransfer?.types.includes('Files')) return
      e.preventDefault()
      enterCount++
      if (enterCount === 1) setIsDragOver(true)
    }

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault()
      enterCount--
      if (enterCount <= 0) {
        enterCount = 0
        setIsDragOver(false)
      }
    }

    const handleDragOver = (e: DragEvent) => {
      if (!e.dataTransfer?.types.includes('Files')) return
      e.preventDefault()
    }

    const handleDrop = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      enterCount = 0
      setIsDragOver(false)

      const files = Array.from(e.dataTransfer?.files ?? [])
      if (files.length === 0) return

      const paths = files
        .map((f) => window.webUtils.getPathForFile(f))
        .filter(Boolean)

      if (paths.length === 0) return

      const text = paths.join(' ')
      const instance = terminalInstances.get(terminalId)
      if (instance) {
        instance.xterm.paste(text)
      }
    }

    document.addEventListener('dragenter', handleDragEnter)
    document.addEventListener('dragleave', handleDragLeave)
    document.addEventListener('dragover', handleDragOver)
    document.addEventListener('drop', handleDrop)

    return () => {
      document.removeEventListener('dragenter', handleDragEnter)
      document.removeEventListener('dragleave', handleDragLeave)
      document.removeEventListener('dragover', handleDragOver)
      document.removeEventListener('drop', handleDrop)
    }
  }, [isActive, terminalId])

  return (
    <div ref={wrapperRef} className="w-full h-full relative" style={{ display: isActive ? 'block' : 'none' }}>
      <div
        ref={containerRef}
        className="w-full h-full"
      />
      {isDragOver && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/80 border-2 border-dashed border-blue-400 rounded-lg">
          <div className="text-blue-300 text-lg font-medium">Drop files here</div>
        </div>
      )}
    </div>
  )
}

// Handle incoming data from the pty — also marks unread for background tabs
const typingTimeouts = new Map<string, ReturnType<typeof setTimeout>>()
const pendingData = new Map<string, { bytes: number; timer: ReturnType<typeof setTimeout> }>()
const recentlyDeactivated = new Set<string>()

// Strip ANSI escape sequences and control chars to measure meaningful content
function meaningfulLength(data: string): number {
  const stripped = data
    .replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '') // CSI sequences
    .replace(/\x1b\][^\x07]*\x07/g, '') // OSC sequences
    .replace(/\x1b[^[\]]/g, '') // Other escape sequences
    .replace(/[\x00-\x1f]/g, '') // Control characters
  return stripped.length
}

export function setupTerminalDataHandler(): () => void {
  // Track terminal switches — suppress indicators briefly for the terminal we just left
  let prevActiveId: string | null = null
  const unsubStore = useTerminalStore.subscribe((state) => {
    const newActiveId = state.activeTerminalId
    if (prevActiveId && prevActiveId !== newActiveId) {
      const deactivatedId = prevActiveId
      recentlyDeactivated.add(deactivatedId)
      pendingData.delete(deactivatedId) // Clear any pending accumulation
      setTimeout(() => recentlyDeactivated.delete(deactivatedId), 500)
    }
    prevActiveId = newActiveId
  })

  const unsub = window.api.onTerminalData((id, data) => {
    const instance = terminalInstances.get(id)
    if (instance) {
      instance.xterm.write(data)
    }

    const store = useTerminalStore.getState()
    if (store.recentlyReconnected.has(id)) return
    if (store.activeTerminalId === id) return // Skip all indicators for active terminal
    if (recentlyDeactivated.has(id)) return // Skip indicators right after switching away

    const meaningful = meaningfulLength(data)
    if (meaningful === 0) return // Pure ANSI/control — skip

    // Accumulate meaningful bytes in a debounce window
    const pending = pendingData.get(id)
    const accumulated = (pending?.bytes ?? 0) + meaningful

    if (pending?.timer) clearTimeout(pending.timer)

    const THRESHOLD = 30 // bytes of meaningful content
    const DEBOUNCE = 300 // ms

    if (accumulated >= THRESHOLD) {
      // Enough content — trigger immediately
      pendingData.delete(id)
      store.markUnread(id)
      store.markTyping(id)

      const existing = typingTimeouts.get(id)
      if (existing) clearTimeout(existing)
      typingTimeouts.set(id, setTimeout(() => {
        useTerminalStore.getState().clearTyping(id)
        typingTimeouts.delete(id)
      }, 1500))
    } else {
      // Not enough yet — wait for more
      pendingData.set(id, {
        bytes: accumulated,
        timer: setTimeout(() => {
          pendingData.delete(id)
        }, DEBOUNCE)
      })
    }
  })
  return () => {
    unsub()
    unsubStore()
  }
}

// Cleanup a terminal instance
export function destroyTerminalInstance(id: string): void {
  const instance = terminalInstances.get(id)
  if (instance) {
    instance.xterm.dispose()
    terminalInstances.delete(id)
  }
}

// Export terminal buffer content as text
export function exportTerminalContent(id: string): string | null {
  const instance = terminalInstances.get(id)
  if (!instance) return null
  const buffer = instance.xterm.buffer.active
  const lines: string[] = []
  for (let i = 0; i < buffer.length; i++) {
    const line = buffer.getLine(i)
    if (line) {
      lines.push(line.translateToString(true))
    }
  }
  // Trim trailing empty lines
  while (lines.length > 0 && lines[lines.length - 1].trim() === '') {
    lines.pop()
  }
  return lines.join('\n')
}
