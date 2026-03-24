import { useState, useEffect, useCallback, useRef } from 'react'
import { getTerminalInstance } from './Terminal'
import { useTerminalStore } from '../stores/chatStore'

function pasteToTerminal(text: string) {
  const activeId = useTerminalStore.getState().activeTerminalId
  if (activeId && text.trim()) {
    const instance = getTerminalInstance(activeId)
    if (instance) {
      instance.xterm.paste(text.trim())
    }
  }
}

export function VoiceInput() {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const pastedRef = useRef(false)

  // Listen for voice events from main process
  useEffect(() => {
    const unsubPartial = window.api.onVoicePartial((text) => {
      setTranscript(text)
    })

    const unsubFinal = window.api.onVoiceFinal((text) => {
      if (!pastedRef.current) {
        pastedRef.current = true
        pasteToTerminal(text)
      }
      setIsListening(false)
      setTranscript('')
    })

    const unsubError = window.api.onVoiceError((msg) => {
      setError(msg)
      setIsListening(false)
      setTimeout(() => setError(null), 3000)
    })

    return () => {
      unsubPartial()
      unsubFinal()
      unsubError()
    }
  }, [])

  const startListening = useCallback(() => {
    if (isListening) return
    setTranscript('')
    setIsListening(true)
    pastedRef.current = false
    window.api.voiceStart().catch(() => {
      setError('Failed to start voice input')
      setIsListening(false)
      setTimeout(() => setError(null), 3000)
    })
  }, [isListening])

  const stopListening = useCallback(() => {
    window.api.voiceStop()
  }, [])

  const cancelListening = useCallback(() => {
    window.api.voiceCancel()
    setTranscript('')
    setIsListening(false)
  }, [])

  // Keyboard shortcut: Cmd+Shift+V to toggle, Escape to cancel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey && e.shiftKey && e.code === 'KeyV') {
        e.preventDefault()
        if (isListening) {
          stopListening()
        } else {
          startListening()
        }
      }
      if (e.key === 'Escape' && isListening) {
        cancelListening()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isListening, startListening, stopListening, cancelListening])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.api.voiceCancel()
    }
  }, [])

  return (
    <>
      {/* Mic button */}
      <button
        onClick={() => isListening ? stopListening() : startListening()}
        className={`fixed bottom-4 right-4 z-40 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all ${
          isListening
            ? 'bg-red-500 hover:bg-red-600 text-white scale-110'
            : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
        }`}
        title={isListening ? 'Stop recording' : 'Voice input (⌘⇧V)'}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
        </svg>
        {isListening && (
          <span className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping" />
        )}
      </button>

      {/* Error toast */}
      {error && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg bg-red-900/90 border border-red-700 text-red-200 text-sm shadow-lg">
          {error}
        </div>
      )}

      {/* Listening overlay */}
      {isListening && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-3">
          {transcript && (
            <div className="px-4 py-2 rounded-lg bg-slate-800/95 border border-slate-700 text-slate-200 text-sm max-w-md truncate shadow-lg">
              {transcript}
            </div>
          )}
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-slate-800/95 border border-red-500/50 shadow-lg">
            <div className="relative">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="absolute inset-0 w-3 h-3 rounded-full bg-red-500 animate-ping" />
            </div>
            <span className="text-sm text-slate-300">Listening...</span>
            <span className="text-[10px] text-slate-500">Click mic or ⌘⇧V to stop | Esc to cancel</span>
          </div>
        </div>
      )}
    </>
  )
}
