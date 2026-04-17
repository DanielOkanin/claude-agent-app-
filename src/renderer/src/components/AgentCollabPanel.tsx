import { useState, useEffect, useRef, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import { useTerminalStore, getProviderById } from '../stores/chatStore'

interface CollabMessage {
  id: string
  from: string
  fromLabel: string
  content: string
  timestamp: number
  type: 'message' | 'plan-update' | 'approval-request' | 'system'
}

interface CollabSession {
  id: string
  name: string
  participants: string[]
  messages: CollabMessage[]
  plan: string | null
  status: 'planning' | 'approved' | 'executing' | 'completed'
}

export function AgentCollabPanel() {
  const { terminals } = useTerminalStore()
  const [sessions, setSessions] = useState<CollabSession[]>([])
  const [activeSession, setActiveSession] = useState<CollabSession | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])
  const [sessionName, setSessionName] = useState('')
  const [planDraft, setPlanDraft] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load sessions
  useEffect(() => {
    window.api.collabList().then(setSessions)
  }, [])

  // Listen for new messages
  useEffect(() => {
    const unsubMsg = window.api.onCollabMessage((sessionId, msg) => {
      setActiveSession((prev) => {
        if (!prev || prev.id !== sessionId) return prev
        return { ...prev, messages: [...prev.messages, msg] }
      })
    })
    const unsubPlan = window.api.onCollabPlanUpdated((sessionId, plan) => {
      setActiveSession((prev) => {
        if (!prev || prev.id !== sessionId) return prev
        return { ...prev, plan }
      })
    })
    const unsubApproved = window.api.onCollabApproved((sessionId) => {
      setActiveSession((prev) => {
        if (!prev || prev.id !== sessionId) return prev
        return { ...prev, status: 'approved' }
      })
    })
    return () => { unsubMsg(); unsubPlan(); unsubApproved() }
  }, [])

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeSession?.messages.length])

  const createSession = useCallback(async () => {
    if (selectedAgents.length < 2 || !sessionName.trim()) return
    const session = await window.api.collabCreate(sessionName.trim(), selectedAgents)
    setSessions((prev) => [session, ...prev])
    setActiveSession(session)
    setShowCreate(false)
    setSelectedAgents([])
    setSessionName('')
  }, [selectedAgents, sessionName])

  const sendToPlan = useCallback(async (fromId: string, content: string) => {
    if (!activeSession) return
    await window.api.collabSend(activeSession.id, fromId, content)
    // Refresh
    const updated = await window.api.collabGet(activeSession.id)
    if (updated) setActiveSession(updated)
  }, [activeSession])

  const startPlanning = useCallback(async () => {
    if (!activeSession || !planDraft.trim()) return
    // Send plan as first message from first participant
    const firstAgent = activeSession.participants[0]
    await window.api.collabSend(activeSession.id, firstAgent, 
      `Let's plan this together. Here's my initial proposal:\n\n${planDraft.trim()}\n\nPlease review, suggest improvements, or approve.`)
    const updated = await window.api.collabGet(activeSession.id)
    if (updated) setActiveSession(updated)
    setPlanDraft('')
  }, [activeSession, planDraft])

  const approvePlan = useCallback(async () => {
    if (!activeSession) return
    await window.api.collabApprove(activeSession.id)
    const updated = await window.api.collabGet(activeSession.id)
    if (updated) setActiveSession(updated)
  }, [activeSession])

  // --- Create session view ---
  if (showCreate) {
    return (
      <div className="h-full flex flex-col bg-[#0f172a] overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <h2 className="text-sm font-medium text-slate-300">New Collaboration</h2>
          <button onClick={() => setShowCreate(false)} className="text-xs text-slate-500 hover:text-slate-300">Cancel</button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <div className="mb-4">
            <label className="text-[11px] text-slate-400 font-medium mb-1.5 block">Session name</label>
            <input
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              placeholder="e.g. Auth system planning"
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700/50 text-xs text-white outline-none focus:border-blue-500"
            />
          </div>
          <div className="mb-4">
            <label className="text-[11px] text-slate-400 font-medium mb-1.5 block">Select 2+ agents to collaborate</label>
            <div className="space-y-1">
              {terminals.map((t) => {
                const provider = getProviderById(t.provider)
                const selected = selectedAgents.includes(t.id)
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      setSelectedAgents((prev) =>
                        selected ? prev.filter((id) => id !== t.id) : [...prev, t.id]
                      )
                    }}
                    className={`w-full px-3 py-2.5 rounded-lg text-left flex items-center gap-2.5 transition-colors ${
                      selected ? 'bg-blue-600/20 border border-blue-500/50' : 'bg-slate-800/50 border border-slate-700/30 hover:bg-slate-800'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full shrink-0 ${selected ? 'bg-blue-400' : 'bg-slate-600'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-white font-medium truncate">{t.title}</div>
                      <div className="text-[10px] text-slate-500">{provider.displayName} · {t.workingDirectory.split('/').pop()}</div>
                    </div>
                    {selected && (
                      <svg className="w-4 h-4 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                )
              })}
              {terminals.length === 0 && (
                <p className="text-[11px] text-slate-500 py-4 text-center">Start at least 2 chats first, then collaborate!</p>
              )}
            </div>
          </div>
          <button
            onClick={createSession}
            disabled={selectedAgents.length < 2 || !sessionName.trim()}
            className="w-full py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
          >
            Start Collaboration ({selectedAgents.length} agents)
          </button>
        </div>
      </div>
    )
  }

  // --- Active session view ---
  if (activeSession) {
    return (
      <div className="h-full flex flex-col bg-[#0f172a] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={() => setActiveSession(null)} className="text-slate-500 hover:text-slate-300 shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="w-2 h-2 rounded-full bg-purple-400 shrink-0" />
            <span className="text-xs text-slate-300 font-medium truncate">{activeSession.name}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
              activeSession.status === 'planning' ? 'bg-yellow-400/10 text-yellow-400' :
              activeSession.status === 'approved' ? 'bg-green-400/10 text-green-400' :
              'bg-slate-700 text-slate-400'
            }`}>
              {activeSession.status}
            </span>
          </div>
          {activeSession.status === 'planning' && (
            <button
              onClick={approvePlan}
              className="px-3 py-1 rounded-lg bg-green-600 hover:bg-green-500 text-white text-[11px] font-medium transition-colors"
            >
              ✓ Approve Plan
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {activeSession.messages.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-slate-400 mb-3">Send the first prompt to start planning</p>
              <textarea
                value={planDraft}
                onChange={(e) => setPlanDraft(e.target.value)}
                placeholder="Describe what you want the agents to plan together..."
                className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700/50 text-xs text-white outline-none focus:border-purple-500 resize-none h-32"
              />
              <button
                onClick={startPlanning}
                disabled={!planDraft.trim()}
                className="mt-3 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs font-medium transition-colors"
              >
                Start Planning
              </button>
            </div>
          )}

          {activeSession.messages.map((msg) => {
            const isFromFirst = msg.from === activeSession.participants[0]
            return (
              <div key={msg.id} className={`flex ${isFromFirst ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[85%] rounded-lg px-3 py-2 ${
                  isFromFirst ? 'bg-slate-800 border border-slate-700/30' : 'bg-purple-900/30 border border-purple-700/30'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-semibold ${isFromFirst ? 'text-blue-400' : 'text-purple-400'}`}>
                      {msg.fromLabel}
                    </span>
                    <span className="text-[9px] text-slate-600">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-xs text-slate-200 leading-relaxed collab-content">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Participants bar */}
        <div className="px-4 py-2 border-t border-slate-800 flex items-center gap-2">
          <span className="text-[10px] text-slate-500">Participants:</span>
          {activeSession.participants.map((pid) => {
            const t = terminals.find((t) => t.id === pid)
            if (!t) return null
            const provider = getProviderById(t.provider)
            return (
              <span key={pid} className={`text-[10px] px-1.5 py-0.5 rounded ${provider.color.text} ${provider.color.bg}`}>
                {provider.displayName}
              </span>
            )
          })}
        </div>
      </div>
    )
  }

  // --- Sessions list ---
  return (
    <div className="h-full flex flex-col bg-[#0f172a] overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
        <h2 className="text-sm font-medium text-slate-300">Agent Collaboration</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-medium transition-colors"
        >
          + New
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {sessions.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center px-6">
            <div>
              <svg className="w-12 h-12 mx-auto text-slate-700 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
              </svg>
              <p className="text-sm text-slate-400 mb-1">No collaborations yet</p>
              <p className="text-[11px] text-slate-600">Let your agents plan together before coding</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/50">
            {sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSession(s)}
                className="w-full px-5 py-3 text-left hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-purple-400" />
                  <span className="text-xs text-white font-medium">{s.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ml-auto ${
                    s.status === 'planning' ? 'bg-yellow-400/10 text-yellow-400' :
                    s.status === 'approved' ? 'bg-green-400/10 text-green-400' :
                    'bg-slate-700 text-slate-400'
                  }`}>
                    {s.status}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500">
                  {s.participants.length} agents · {s.messages.length} messages
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
