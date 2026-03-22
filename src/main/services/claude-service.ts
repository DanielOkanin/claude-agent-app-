import { query } from '@anthropic-ai/claude-agent-sdk'
import type { StreamingEvent, PermissionMode } from '../types'

export class ClaudeService {
  private activeControllers = new Map<string, AbortController>()

  async sendMessage(
    chatId: string,
    prompt: string,
    workingDirectory: string,
    claudeSessionId: string | null,
    permissionMode: PermissionMode,
    onEvent: (event: StreamingEvent) => void
  ): Promise<void> {
    const abortController = new AbortController()
    this.activeControllers.set(chatId, abortController)

    try {
      const queryResult = query({
        prompt,
        options: {
          cwd: workingDirectory,
          permissionMode,
          includePartialMessages: true,
          resume: claudeSessionId || undefined,
          abortController
        }
      })

      for await (const message of queryResult) {
        if (message.type === 'stream_event') {
          const event = (message as any).event
          if (
            event?.type === 'content_block_delta' &&
            event.delta?.type === 'text_delta' &&
            event.delta.text
          ) {
            onEvent({
              type: 'text_delta',
              chatId,
              content: event.delta.text
            })
          }
        } else if (message.type === 'assistant') {
          const content = (message as any).message?.content
          if (Array.isArray(content)) {
            for (const block of content) {
              if (block.type === 'tool_use') {
                onEvent({
                  type: 'tool_use_start',
                  chatId,
                  toolName: block.name,
                  toolInput: JSON.stringify(block.input)
                })
                onEvent({
                  type: 'tool_use_end',
                  chatId
                })
              }
            }
          }
        } else if (message.type === 'result') {
          const result = message as any
          onEvent({
            type: 'complete',
            chatId,
            sessionId: result.session_id
          })
        }
      }
    } catch (err) {
      if (!abortController.signal.aborted) {
        onEvent({
          type: 'error',
          chatId,
          error: err instanceof Error ? err.message : String(err)
        })
      }
    } finally {
      this.activeControllers.delete(chatId)
    }
  }

  cancelChat(chatId: string): void {
    const controller = this.activeControllers.get(chatId)
    if (controller) {
      controller.abort()
      this.activeControllers.delete(chatId)
    }
  }
}
