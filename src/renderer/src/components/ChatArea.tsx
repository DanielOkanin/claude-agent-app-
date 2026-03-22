import { useEffect, useRef } from 'react'
import { useChatStore } from '../stores/chatStore'
import { MarkdownRenderer } from './MarkdownRenderer'
import { InputBar } from './InputBar'

function ToolUseIndicator({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2.5 mt-2 px-3 py-2 rounded-lg bg-slate-900/50 text-sm text-slate-400 border border-slate-700/30">
      <div className="w-3.5 h-3.5 border-2 border-slate-600 border-t-blue-400 rounded-full animate-spin shrink-0" />
      <span className="text-xs">Running <span className="text-slate-300 font-medium">{name}</span></span>
    </div>
  )
}

function StreamingMessage({ content, toolName }: { content: string; toolName?: string | null }) {
  return (
    <div className="flex gap-3 mb-5">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-amber-600 flex items-center justify-center shrink-0 mt-1 text-white text-xs font-bold">C</div>
      <div className="min-w-0 flex-1 max-w-3xl">
        <div className="text-[11px] text-slate-500 mb-1 font-medium">Claude</div>
        <div className="rounded-xl px-4 py-3 bg-slate-800/60 text-white border border-slate-700/30">
          {content && (
            <div className="streaming-cursor">
              <MarkdownRenderer content={content} />
            </div>
          )}
          {toolName && <ToolUseIndicator name={toolName} />}
          {!content && !toolName && (
            <div className="streaming-cursor text-slate-400 text-sm">Thinking...</div>
          )}
        </div>
      </div>
    </div>
  )
}

function PlanModeToggle() {
  const { activeChatId, chats, togglePlanMode } = useChatStore()
  const chat = chats.find((c) => c.id === activeChatId)
  if (!chat) return null
  const isPlan = chat.permissionMode === 'plan'

  return (
    <button
      onClick={togglePlanMode}
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all border ${
        isPlan
          ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25'
          : 'bg-slate-800 text-slate-400 border-slate-700/50 hover:bg-slate-700 hover:text-slate-300'
      }`}
      title={isPlan ? 'Switch to Edit mode (Claude can edit files)' : 'Switch to Plan mode (Claude only plans, no edits)'}
    >
      {isPlan ? (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      )}
      {isPlan ? 'Plan' : 'Edit'}
    </button>
  )
}

export function ChatArea() {
  const { activeChatId, chats, messages, streamingContent, activeTools, isLoading } =
    useChatStore()
  const scrollRef = useRef<HTMLDivElement>(null)

  const activeChat = chats.find((c) => c.id === activeChatId)
  const chatMessages = activeChatId ? messages[activeChatId] || [] : []
  const streaming = activeChatId ? streamingContent[activeChatId] || '' : ''
  const activeTool = activeChatId ? activeTools[activeChatId] : null
  const chatLoading = activeChatId ? isLoading[activeChatId] : false

  useEffect(() => {
    const el = scrollRef.current
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  }, [chatMessages, streaming])

  if (!activeChat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-850">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400/20 to-amber-600/20 flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-amber-500/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m6.75 7.5 3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0 0 21 18V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v12a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-slate-300 mb-2">Open a terminal</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            Create a new terminal to start working with Claude. Pick a project directory and Claude will have full context of your codebase.
          </p>
          <p className="text-xs text-slate-600 mt-4">
            <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-[10px] border border-slate-700">Cmd+N</kbd> to open a new terminal
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-850 min-w-0">
      {/* Header */}
      <div className="px-6 py-3 border-b border-slate-700/50 shrink-0 flex items-center justify-between">
        <div className="min-w-0">
          <h2 className="text-[15px] text-white font-semibold truncate">{activeChat.title}</h2>
          <div className="text-[11px] text-slate-500 truncate flex items-center gap-1.5 mt-0.5">
            <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            {activeChat.workingDirectory}
          </div>
        </div>
        <PlanModeToggle />
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-5">
        <div className="max-w-4xl mx-auto">
          {chatMessages.map((msg) => {
            if (msg.role === 'system') {
              return (
                <div key={msg.id} className="flex justify-center mb-5">
                  <div className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 text-xs max-w-[80%] border border-red-500/20">
                    {msg.content}
                  </div>
                </div>
              )
            }

            const isUser = msg.role === 'user'
            return (
              <div key={msg.id} className={`flex gap-3 pb-5 border-b border-slate-700/30 mb-5 ${isUser ? 'flex-row-reverse' : ''}`}>
                {isUser ? (
                  <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center shrink-0 mt-1 text-white text-xs font-bold">U</div>
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-amber-600 flex items-center justify-center shrink-0 mt-1 text-white text-xs font-bold">C</div>
                )}
                <div className={`min-w-0 max-w-3xl ${isUser ? 'flex flex-col items-end' : ''}`}>
                  <div className={`text-[11px] mb-1 font-medium ${isUser ? 'text-blue-400' : 'text-slate-500'}`}>
                    {isUser ? 'You' : 'Claude'}
                  </div>
                  <div
                    className={`rounded-xl px-4 py-3 ${
                      isUser
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800/60 text-white border border-slate-700/30'
                    }`}
                  >
                    {isUser ? (
                      <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
                    ) : (
                      <MarkdownRenderer content={msg.content} />
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          {chatLoading && (
            <StreamingMessage
              content={streaming}
              toolName={activeTool?.name}
            />
          )}
        </div>
      </div>

      <InputBar />
    </div>
  )
}
