import { query } from '@anthropic-ai/claude-agent-sdk'

const SUMMARY_PROMPT = `Summarize this conversation concisely for continuing in a new session. Include:
1. The user's main goals and what they asked for
2. Key tool actions taken (files edited, commands run, searches performed)
3. Important decisions made and approaches chosen
4. Current state of the work (what was completed, what is in progress)
5. Any pending tasks or next steps mentioned

Write in second person ("You were working on..."). Keep it concise but thorough (2-4 paragraphs).`

export async function generateSummary(sessionId: string, workingDirectory: string): Promise<string | null> {
  const abortController = new AbortController()
  const timeout = setTimeout(() => abortController.abort(), 180000)

  try {
    console.log('[summarizer] Resuming session', sessionId, 'in', workingDirectory)
    // Don't specify model — let SDK use its default (avoids Opus timeout on large contexts)
    const result = query({
      prompt: SUMMARY_PROMPT,
      options: {
        resume: sessionId,
        forkSession: true,
        persistSession: false,
        cwd: workingDirectory,
        permissionMode: 'dontAsk',
        allowedTools: [],
        abortController
      }
    })

    let summary = ''
    for await (const message of result) {
      const msg = message as any
      console.log('[summarizer] Message type:', msg.type, msg.subtype || '')
      if (msg.type === 'user') {
        // Reset on each user message so we only capture the response to our prompt,
        // not replayed assistant content from the original session
        summary = ''
      } else if (msg.type === 'assistant') {
        const content = msg.message?.content
        if (Array.isArray(content)) {
          for (const block of content) {
            if (block.type === 'text' && block.text) {
              summary += block.text
            }
          }
        }
      } else if (msg.type === 'result') {
        // Capture from both success and error_max_turns (partial summary is better than none)
        if ((msg.subtype === 'success' || msg.subtype === 'error_max_turns') && msg.result && !summary) {
          summary = msg.result
        }
      }
    }

    console.log('[summarizer] Done, summary length:', summary.length)
    return summary.trim() || null
  } catch (err) {
    console.error('[summarizer] Failed to generate conversation summary:', err)
    return null
  } finally {
    clearTimeout(timeout)
  }
}
