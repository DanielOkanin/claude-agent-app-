import { interpolate, useCurrentFrame, spring, useVideoConfig } from 'remotion'

const StatusDot = ({ color, delay }: { color: string; delay: number }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const scale = spring({ frame: frame - delay, fps, config: { damping: 12 } })
  return (
    <div style={{
      width: 8, height: 8, borderRadius: '50%',
      backgroundColor: color,
      transform: `scale(${scale})`,
    }} />
  )
}

interface ChatItem {
  title: string
  model: string
  modelColor: string
  branch?: string
  time: string
  active?: boolean
  connected?: boolean
  typing?: boolean
  delay: number
}

const ChatRow = ({ chat }: { chat: ChatItem }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const slideIn = spring({ frame: frame - chat.delay, fps, config: { damping: 15 } })
  const opacity = interpolate(slideIn, [0, 1], [0, 1])
  const translateX = interpolate(slideIn, [0, 1], [-30, 0])

  const dotColor = chat.typing ? '#facc15' : chat.connected ? '#34d399' : '#475569'

  return (
    <div style={{
      opacity,
      transform: `translateX(${translateX}px)`,
      padding: '10px 14px',
      borderRadius: 10,
      backgroundColor: chat.active ? '#1e293b' : 'transparent',
      marginBottom: 3,
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <StatusDot color={dotColor} delay={chat.delay + 5} />
        <span style={{
          fontSize: 14, fontWeight: 600,
          color: chat.active ? '#fff' : '#cbd5e1',
        }}>{chat.title}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 16 }}>
        <span style={{
          fontSize: 11, padding: '2px 6px', borderRadius: 4,
          color: chat.modelColor, backgroundColor: `${chat.modelColor}15`,
        }}>{chat.model}</span>
        {chat.branch && (
          <span style={{
            fontSize: 11, padding: '2px 6px', borderRadius: 4,
            color: '#34d399', backgroundColor: '#34d39915',
          }}>{chat.branch}</span>
        )}
        <span style={{ fontSize: 11, color: '#475569', marginLeft: 'auto' }}>{chat.time}</span>
      </div>
    </div>
  )
}

interface FeatureGroupProps {
  name: string
  chats: ChatItem[]
  delay: number
  expanded?: boolean
}

export const FeatureGroup = ({ name, chats, delay, expanded = true }: FeatureGroupProps) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const slideIn = spring({ frame: frame - delay, fps, config: { damping: 15 } })
  const opacity = interpolate(slideIn, [0, 1], [0, 1])
  const translateY = interpolate(slideIn, [0, 1], [20, 0])

  return (
    <div style={{ opacity, transform: `translateY(${translateY}px)`, marginBottom: 6 }}>
      {/* Feature header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '6px 8px', borderRadius: 6,
      }}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="3"
          style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
        </svg>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>{name}</span>
        <span style={{ fontSize: 11, color: '#475569', marginLeft: 'auto' }}>{chats.length}</span>
      </div>
      {/* Chats */}
      {expanded && chats.map((chat, i) => (
        <ChatRow key={i} chat={chat} />
      ))}
    </div>
  )
}

export const MockSidebar = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const fadeIn = spring({ frame: frame - delay, fps, config: { damping: 20 } })
  const opacity = interpolate(fadeIn, [0, 1], [0, 1])

  return (
    <div style={{
      width: 280, height: '100%',
      backgroundColor: '#0f172a',
      borderRight: '1px solid #1e293b',
      display: 'flex', flexDirection: 'column',
      opacity,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      {/* Logo */}
      <div style={{ padding: '24px 16px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10,
          background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="m6.75 7.5 3 2.25-3 2.25m4.5 0h3" />
          </svg>
        </div>
        <span style={{ fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: -0.5 }}>CLI Studio</span>
      </div>

      {/* New Chat button */}
      <div style={{ padding: '0 12px 16px' }}>
        <div style={{
          display: 'flex', borderRadius: 10, overflow: 'hidden',
        }}>
          <div style={{
            flex: 1, padding: '12px 0',
            backgroundColor: '#2563eb',
            color: '#fff', fontSize: 14, fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Chat
          </div>
          <div style={{
            padding: '12px 10px',
            backgroundColor: '#2563eb',
            borderLeft: '1px solid #3b82f680',
            display: 'flex', alignItems: 'center',
          }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '0 8px', overflowY: 'hidden' }}>
        {children}
      </div>
    </div>
  )
}
