import { AbsoluteFill, interpolate, useCurrentFrame, spring, useVideoConfig } from 'remotion'
import { MockSidebar, FeatureGroup } from '../components/MockSidebar'
import { MockTerminal } from '../components/MockTerminal'
import { GlowText } from '../components/GlowText'

export const FeatureGroupsScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // Entry
  const enterOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' })
  // Exit
  const exitOpacity = interpolate(frame, [95, 110], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  // Highlight pulse on feature groups
  const highlightOpacity = interpolate(frame, [40, 50, 60, 70], [0, 0.3, 0, 0.3], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp'
  })

  return (
    <AbsoluteFill style={{ opacity: enterOpacity * exitOpacity }}>
      {/* Caption */}
      <div style={{
        position: 'absolute', top: 40, left: 0, right: 0,
        display: 'flex', justifyContent: 'center', zIndex: 10,
      }}>
        <GlowText text="Organize by Feature" size={36} color="#fbbf24" delay={5} />
      </div>

      <div style={{ display: 'flex', height: '100%', paddingTop: 100 }}>
        {/* Sidebar with features */}
        <MockSidebar delay={5}>
          <FeatureGroup
            name="Auth Rewrite"
            delay={15}
            chats={[
              { title: 'Implement OAuth flow', model: 'Opus 4.7', modelColor: '#fb923c', branch: 'feat/auth', time: '2m', active: true, connected: true, typing: true, delay: 20 },
              { title: 'Add session tokens', model: 'Sonnet 4.6', modelColor: '#fb923c', time: '15m', connected: true, delay: 25 },
            ]}
          />
          <FeatureGroup
            name="Dashboard v2"
            delay={30}
            chats={[
              { title: 'Chart components', model: 'Opus 4.7', modelColor: '#fb923c', branch: 'feat/dashboard', time: '8m', connected: true, delay: 35 },
              { title: 'API endpoints', model: 'Composer 2', modelColor: '#a78bfa', time: '1h', delay: 40 },
            ]}
          />
          <FeatureGroup
            name="CI Pipeline"
            delay={45}
            expanded={false}
            chats={[
              { title: 'Docker setup', model: 'Opus 4.6', modelColor: '#fb923c', time: '3h', delay: 50 },
            ]}
          />

          {/* Ungrouped label */}
          <div style={{ padding: '12px 8px 4px', opacity: interpolate(spring({ frame: frame - 55, fps, config: { damping: 15 } }), [0, 1], [0, 1]) }}>
            <span style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>Ungrouped</span>
          </div>
          <FeatureGroup
            name=""
            delay={55}
            chats={[
              { title: 'Quick fix typos', model: 'Haiku 4.5', modelColor: '#fb923c', time: '5h', delay: 60 },
            ]}
          />
        </MockSidebar>

        {/* Terminal area */}
        <div style={{ flex: 1, padding: 20, display: 'flex', flexDirection: 'column' }}>
          <MockTerminal
            title="Implement OAuth flow  |  feat/auth  |  Opus 4.7"
            delay={10}
            lines={[
              { text: '$ claude --model claude-opus-4-7 --session-id abc123', color: '#64748b', delay: 15 },
              { text: '', delay: 20 },
              { text: '  Claude Code v2.1.84', color: '#fb923c', delay: 25 },
              { text: '  Opus 4.7 with high effort', color: '#94a3b8', delay: 28 },
              { text: '  ~/project (feat/auth)', color: '#94a3b8', delay: 31 },
              { text: '', delay: 35 },
              { text: '> Implement OAuth 2.0 login with Google and GitHub providers', color: '#e2e8f0', delay: 40, typing: true },
              { text: '', delay: 70 },
              { text: '  I\'ll set up the OAuth flow. Let me start by creating the auth routes...', color: '#34d399', delay: 75 },
            ]}
          />
        </div>
      </div>

      {/* Highlight overlay on sidebar */}
      <div style={{
        position: 'absolute', left: 0, top: 100, width: 280, height: 'calc(100% - 100px)',
        backgroundColor: `#fbbf24`,
        opacity: highlightOpacity,
        borderRadius: 8,
        pointerEvents: 'none',
      }} />
    </AbsoluteFill>
  )
}
