import { useState, useEffect, useCallback } from 'react'
import { useTerminalStore } from '../stores/chatStore'

interface GitFileChange {
  status: string
  filePath: string
  type: 'modified' | 'added' | 'deleted' | 'renamed' | 'untracked'
}

function getStatusColor(type: string): string {
  switch (type) {
    case 'modified': return '#60a5fa'
    case 'added': return '#4ade80'
    case 'deleted': return '#f87171'
    case 'renamed': return '#c084fc'
    case 'untracked': return '#facc15'
    default: return '#94a3b8'
  }
}

function getStatusIcon(type: string): string {
  switch (type) {
    case 'modified': return 'M'
    case 'added': return 'A'
    case 'deleted': return 'D'
    case 'renamed': return 'R'
    case 'untracked': return 'U'
    default: return '?'
  }
}

export function ChangedFilesPanel({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  const { terminals, activeTerminalId } = useTerminalStore()
  const [files, setFiles] = useState<GitFileChange[]>([])

  const activeTerminal = terminals.find((t) => t.id === activeTerminalId)
  const cwd = activeTerminal?.workingDirectory

  const refresh = useCallback(async () => {
    if (!cwd) {
      setFiles([])
      return
    }
    const result = await window.api.gitStatus(cwd)
    setFiles(result)
  }, [cwd])

  useEffect(() => {
    if (!isOpen || !cwd) return
    refresh()
    const interval = setInterval(refresh, 3000)
    return () => clearInterval(interval)
  }, [isOpen, cwd, refresh])

  const openDiff = (filePath: string) => {
    if (!cwd) return
    window.api.openDiffWindow(cwd, filePath)
  }

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="absolute right-0 top-1/2 -translate-y-1/2 bg-slate-800 border border-slate-700/50 border-r-0 rounded-l-md px-1 py-3 text-slate-500 hover:text-slate-300 transition-colors z-10"
        title="Show changed files"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
    )
  }

  const grouped = {
    modified: files.filter((f) => f.type === 'modified'),
    added: files.filter((f) => f.type === 'added'),
    deleted: files.filter((f) => f.type === 'deleted'),
    untracked: files.filter((f) => f.type === 'untracked'),
    renamed: files.filter((f) => f.type === 'renamed')
  }

  return (
    <div className="w-full bg-slate-900 border-l border-slate-700/50 flex flex-col h-full">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-slate-700/40 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <span className="text-[13px] font-semibold text-slate-300">Changes</span>
          {files.length > 0 && (
            <span className="text-[10px] bg-blue-500/15 text-blue-400 px-1.5 py-0.5 rounded-full font-semibold">
              {files.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={refresh}
            className="w-6.5 h-6.5 rounded flex items-center justify-center bg-transparent text-slate-500 cursor-pointer hover:text-slate-300 transition-colors"
            title="Refresh"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M2.985 19.644l3.181-3.182" />
            </svg>
          </button>
          <button
            onClick={onToggle}
            className="w-6.5 h-6.5 rounded flex items-center justify-center bg-transparent text-slate-500 cursor-pointer hover:text-slate-300 transition-colors"
            title="Hide panel"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* File list */}
      <div className="flex-1 overflow-y-auto py-1">
        {files.length === 0 && (
          <div className="px-4 py-8 text-center">
            <svg className="w-8 h-8 mx-auto text-slate-700 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-slate-600">No changes detected</p>
          </div>
        )}

        {Object.entries(grouped).map(([type, groupFiles]) => {
          if (groupFiles.length === 0) return null
          return (
            <div key={type} className="mb-1">
              <div className="px-3 py-1.5 text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                {type} ({groupFiles.length})
              </div>
              {groupFiles.map((file) => {
                const fileName = file.filePath.split('/').pop() || file.filePath
                const dirPath = file.filePath.includes('/')
                  ? file.filePath.substring(0, file.filePath.lastIndexOf('/'))
                  : ''
                return (
                  <button
                    key={file.filePath}
                    onClick={() => openDiff(file.filePath)}
                    className="w-full px-3 py-2 flex items-center gap-2 bg-transparent border-l-3 border-transparent cursor-pointer text-left transition-[background] duration-150 hover:bg-slate-800/50"
                  >
                    <span
                      className="text-[10px] font-mono font-bold w-[18px] h-[18px] rounded flex items-center justify-center shrink-0"
                      style={{ color: getStatusColor(file.type), background: `${getStatusColor(file.type)}15` }}
                    >
                      {getStatusIcon(file.type)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-slate-200 truncate">{fileName}</div>
                      {dirPath && (
                        <div className="text-[10px] text-slate-600 truncate">{dirPath}</div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
