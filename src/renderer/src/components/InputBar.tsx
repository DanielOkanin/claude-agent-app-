import { useState, useRef, useCallback, KeyboardEvent } from 'react'
import { useChatStore } from '../stores/chatStore'

export function InputBar() {
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { activeChatId, isLoading, sendMessage, cancelMessage } = useChatStore()

  const chatLoading = activeChatId ? isLoading[activeChatId] : false

  const handleSend = useCallback(() => {
    const trimmed = input.trim()
    if (!trimmed || !activeChatId || chatLoading) return
    sendMessage(trimmed)
    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [input, activeChatId, chatLoading, sendMessage])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey && !(e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        handleSend()
      }
      // Cmd/Ctrl+Enter inserts a newline (default textarea behavior when not prevented)
    },
    [handleSend]
  )

  const handleInput = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 200) + 'px'
  }, [])

  return (
    <div className="px-6 py-4 border-t border-slate-700/50">
      <div className="flex gap-3 items-end max-w-4xl mx-auto">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              handleInput()
            }}
            onKeyDown={handleKeyDown}
            placeholder={activeChatId ? 'Message Claude...' : 'Select a chat first'}
            disabled={!activeChatId}
            rows={1}
            className="w-full bg-slate-800/80 text-white text-sm rounded-xl px-4 py-3 resize-none outline-none border border-slate-600/50 focus:border-blue-500/70 focus:ring-1 focus:ring-blue-500/30 transition-all placeholder-slate-500 disabled:opacity-40"
            style={{ maxHeight: 200 }}
          />
        </div>
        {chatLoading ? (
          <button
            onClick={cancelMessage}
            className="h-[44px] px-5 rounded-xl bg-red-500/90 hover:bg-red-500 text-white text-sm font-medium transition-all shrink-0 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <rect x="6" y="6" width="12" height="12" rx="1" />
            </svg>
            Stop
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!activeChatId || !input.trim()}
            className="h-[44px] w-[44px] rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0 flex items-center justify-center"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        )}
      </div>
      <div className="text-[11px] text-slate-500 mt-2 text-center max-w-4xl mx-auto">
        {activeChatId ? (
          <span><kbd className="px-1 py-0.5 bg-slate-800 rounded text-[10px]">Enter</kbd> to send, <kbd className="px-1 py-0.5 bg-slate-800 rounded text-[10px]">Shift+Enter</kbd> for new line</span>
        ) : ''}
      </div>
    </div>
  )
}
