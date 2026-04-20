import { AbsoluteFill, interpolate, useCurrentFrame, spring, useVideoConfig } from 'remotion'
import { GlowText } from '../components/GlowText'

const ChatBubble = ({ agent, color, text, delay, align }: {
  agent: string; color: string; text: string; delay: number; align: 'left' | 'right'
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const pop = spring({ frame: frame - delay, fps, config: { damping: 12 } })
  const opacity = interpolate(pop, [0, 1], [0, 1])
  const translateY = interpolate(pop, [0, 1], [20, 0])
  const scale = interpolate(pop, [0, 1], [0.9, 1])

  return (
    <div style={{
      opacity,
      transform: `translateY(${translateY}px) scale(${scale})`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: align === 'right' ? 'flex-end' : 'flex-start',
      marginBottom: 16,
    }}>
      {/* Agent name */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6,
        flexDirection: align === 'right' ? 'row-reverse' : 'row',
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          backgroundColor: `${color}25`,
          border: `1px solid ${color}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="m6.75 7.5 3 2.25-3 2.25m4.5 0h3" />
          </svg>
        </div>
        <span style={{
          fontSize: 12, fontWeight: 600, color,
          fontFamily: '-apple-system, sans-serif',
        }}>{agent}</span>
      </div>

      {/* Bubble */}
      <div style={{
        maxWidth: '75%',
        padding: '14px 18px',
        backgroundColor: align === 'right' ? `${color}12` : '#1e293b',
        border: `1px solid ${align === 'right' ? `${color}30` : '#334155'}`,
        borderRadius: align === 'right' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
        fontSize: 14,
        lineHeight: 1.6,
        color: '#e2e8f0',
        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      }}>
        {text}
      </div>
    </div>
  )
}

const StatusUpdate = ({ text, delay }: { text: string; delay: number }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const fadeIn = spring({ frame: frame - delay, fps, config: { damping: 15 } })

  return (
    <div style={{
      opacity: interpolate(fadeIn, [0, 1], [0, 1]),
      display: 'flex',
      justifyContent: 'center',
      margin: '12px 0',
    }}>
      <div style={{
        padding: '6px 16px',
        backgroundColor: '#1e293b',
        borderRadius: 20,
        fontSize: 11,
        color: '#64748b',
        fontFamily: '-apple-system, sans-serif',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
        </svg>
        {text}
      </div>
    </div>
  )
}

export const AgentCollabScene: React.FC = () => {
  const frame = useCurrentFrame()

  const enterOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' })
  const exitOpacity = interpolate(frame, [85, 100], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{
      backgroundColor: '#0f172a',
      opacity: enterOpacity * exitOpacity,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Caption */}
      <div style={{ padding: '40px 0 20px', display: 'flex', justifyContent: 'center' }}>
        <GlowText text="Agent Collaboration" size={36} color="#f472b6" delay={0} />
      </div>

      {/* Collab panel */}
      <div style={{
        flex: 1,
        margin: '0 160px 40px',
        backgroundColor: '#0d1526',
        borderRadius: 16,
        border: '1px solid #1e293b',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f472b6" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
            <span style={{
              fontSize: 16, fontWeight: 700, color: '#e2e8f0',
              fontFamily: '-apple-system, sans-serif',
            }}>API Redesign Session</span>
          </div>

          {/* Participants */}
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{
              padding: '4px 12px', borderRadius: 20,
              backgroundColor: '#fb923c20', border: '1px solid #fb923c40',
              fontSize: 12, color: '#fb923c', fontWeight: 600,
              fontFamily: '-apple-system, sans-serif',
            }}>Claude Opus</div>
            <div style={{
              padding: '4px 12px', borderRadius: 20,
              backgroundColor: '#a78bfa20', border: '1px solid #a78bfa40',
              fontSize: 12, color: '#a78bfa', fontWeight: 600,
              fontFamily: '-apple-system, sans-serif',
            }}>Cursor</div>
          </div>
        </div>

        {/* Chat messages */}
        <div style={{ flex: 1, padding: '20px 24px', overflow: 'hidden' }}>
          <ChatBubble
            agent="Claude Opus 4.7"
            color="#fb923c"
            text="I've analyzed the current REST API. I suggest we migrate to a resource-based pattern with consistent naming. Here's my proposal for the endpoints..."
            delay={10}
            align="left"
          />

          <ChatBubble
            agent="Cursor Composer"
            color="#a78bfa"
            text="Agreed on the resource pattern. I'd also add versioning via URL prefix (/v2/) and switch to cursor-based pagination. I can handle the migration of the existing controllers."
            delay={25}
            align="right"
          />

          <StatusUpdate text="Opus is reviewing the proposal..." delay={40} />

          <ChatBubble
            agent="Claude Opus 4.7"
            color="#fb923c"
            text="Good additions. Let me draft the OpenAPI spec while you start on the controllers. I'll include the pagination schema. Ready to approve the plan?"
            delay={48}
            align="left"
          />

          {/* Approve button */}
          {frame > 62 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginTop: 16,
              opacity: interpolate(
                spring({ frame: frame - 62, fps: 30, config: { damping: 12 } }),
                [0, 1], [0, 1]
              ),
              transform: `scale(${spring({ frame: frame - 62, fps: 30, config: { damping: 10, stiffness: 200 } })})`,
            }}>
              <div style={{
                padding: '12px 32px',
                backgroundColor: frame > 72 ? '#16a34a' : '#22c55e',
                borderRadius: 12,
                color: '#fff',
                fontSize: 15,
                fontWeight: 700,
                fontFamily: '-apple-system, sans-serif',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 0 30px #22c55e30',
                transform: frame > 72 ? 'scale(0.95)' : 'scale(1)',
              }}>
                {frame > 72 ? (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Plan Approved — Agents executing
                  </>
                ) : (
                  'Approve Plan'
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  )
}
