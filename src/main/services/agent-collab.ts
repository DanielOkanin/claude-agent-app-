import { EventEmitter } from 'events'

export interface CollabMessage {
  id: string
  from: string       // terminal ID
  fromLabel: string   // display name like "Claude (Opus)" or "Cursor"
  to: string          // terminal ID or 'all'
  content: string
  timestamp: number
  type: 'message' | 'plan-update' | 'approval-request' | 'system'
}

export interface CollabSession {
  id: string
  name: string
  participants: string[]    // terminal IDs
  messages: CollabMessage[]
  plan: string | null       // shared plan document
  status: 'planning' | 'approved' | 'executing' | 'completed'
  createdAt: number
}

/**
 * Agent Collaboration Bus
 * 
 * Enables agents in different terminal sessions to communicate.
 * Messages are relayed by injecting text into the target agent's terminal.
 */
export class AgentCollabService extends EventEmitter {
  private sessions = new Map<string, CollabSession>()
  private counter = 0

  createSession(name: string, participantIds: string[]): CollabSession {
    const id = `collab-${Date.now()}-${++this.counter}`
    const session: CollabSession = {
      id,
      name,
      participants: participantIds,
      messages: [],
      plan: null,
      status: 'planning',
      createdAt: Date.now()
    }
    this.sessions.set(id, session)
    this.emit('session:created', session)
    return session
  }

  sendMessage(sessionId: string, from: string, fromLabel: string, content: string, type: CollabMessage['type'] = 'message'): CollabMessage | null {
    const session = this.sessions.get(sessionId)
    if (!session) return null

    const msg: CollabMessage = {
      id: `msg-${Date.now()}-${++this.counter}`,
      from,
      fromLabel,
      to: 'all',
      content,
      timestamp: Date.now(),
      type
    }

    session.messages.push(msg)

    // If this is a plan update, save it
    if (type === 'plan-update') {
      session.plan = content
    }

    this.emit('message', sessionId, msg)
    return msg
  }

  updatePlan(sessionId: string, plan: string): void {
    const session = this.sessions.get(sessionId)
    if (!session) return
    session.plan = plan
    this.emit('plan:updated', sessionId, plan)
  }

  approvePlan(sessionId: string): void {
    const session = this.sessions.get(sessionId)
    if (!session) return
    session.status = 'approved'
    this.emit('plan:approved', sessionId)
  }

  getSession(sessionId: string): CollabSession | null {
    return this.sessions.get(sessionId) || null
  }

  listSessions(): CollabSession[] {
    return Array.from(this.sessions.values()).sort((a, b) => b.createdAt - a.createdAt)
  }

  getMessages(sessionId: string): CollabMessage[] {
    return this.sessions.get(sessionId)?.messages || []
  }

  deleteSession(sessionId: string): void {
    this.sessions.delete(sessionId)
    this.emit('session:deleted', sessionId)
  }

  /**
   * Build the prompt that gets injected into an agent's terminal
   * to relay what the other agent said.
   */
  buildRelayPrompt(msg: CollabMessage, plan: string | null): string {
    const lines: string[] = []
    lines.push(`[Collaboration] ${msg.fromLabel} says:`)
    lines.push('')
    lines.push(msg.content)
    
    if (plan) {
      lines.push('')
      lines.push('Current shared plan:')
      lines.push('```')
      lines.push(plan)
      lines.push('```')
    }

    lines.push('')
    lines.push('Please review and respond with your thoughts, suggestions, or approval.')
    
    return lines.join('\n')
  }
}
