import { AbsoluteFill, interpolate, useCurrentFrame, spring, useVideoConfig } from 'remotion'
import { MockTerminal } from '../components/MockTerminal'
import { GlowText } from '../components/GlowText'

export const ParallelAgentsScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const enterOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' })
  const exitOpacity = interpolate(frame, [75, 90], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{
      backgroundColor: '#0f172a',
      opacity: enterOpacity * exitOpacity,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Caption */}
      <div style={{
        padding: '40px 0 20px',
        display: 'flex', justifyContent: 'center',
      }}>
        <GlowText text="Parallel Agents, Different Branches" size={36} color="#a78bfa" delay={0} />
      </div>

      {/* Two terminals side by side */}
      <div style={{ flex: 1, display: 'flex', gap: 16, padding: '0 40px 40px' }}>
        {/* Left terminal — Claude on feat/auth */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Branch badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            marginBottom: 10, padding: '6px 12px',
            backgroundColor: '#34d39915', borderRadius: 8,
            alignSelf: 'flex-start',
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#34d399' }} />
            <span style={{ fontSize: 13, color: '#34d399', fontWeight: 600, fontFamily: '-apple-system, sans-serif' }}>
              feat/auth
            </span>
            <span style={{ fontSize: 12, color: '#fb923c', fontFamily: '-apple-system, sans-serif' }}>
              Claude Opus 4.7
            </span>
          </div>

          <MockTerminal
            title="Auth Implementation"
            delay={10}
            lines={[
              { text: '  Working on OAuth 2.0 integration...', color: '#34d399', delay: 15 },
              { text: '', delay: 20 },
              { text: '  Created src/auth/oauth.ts', color: '#94a3b8', delay: 25 },
              { text: '  Created src/auth/providers/google.ts', color: '#94a3b8', delay: 32 },
              { text: '  Created src/auth/providers/github.ts', color: '#94a3b8', delay: 39 },
              { text: '  Updated src/routes/login.ts', color: '#94a3b8', delay: 46 },
              { text: '', delay: 50 },
              { text: '  Running tests...', color: '#fbbf24', delay: 53 },
              { text: '  12 tests passed', color: '#34d399', delay: 60 },
            ]}
          />
        </div>

        {/* Divider with lightning bolt */}
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '0 8px',
        }}>
          <div style={{
            width: 2, flex: 1,
            background: 'linear-gradient(to bottom, transparent, #8b5cf640, transparent)',
          }} />
          <div style={{
            margin: '12px 0',
            width: 40, height: 40, borderRadius: '50%',
            backgroundColor: '#8b5cf620',
            border: '1px solid #8b5cf640',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          </div>
          <div style={{
            width: 2, flex: 1,
            background: 'linear-gradient(to bottom, transparent, #8b5cf640, transparent)',
          }} />
        </div>

        {/* Right terminal — Cursor on feat/dashboard */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Branch badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            marginBottom: 10, padding: '6px 12px',
            backgroundColor: '#a78bfa15', borderRadius: 8,
            alignSelf: 'flex-start',
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#a78bfa' }} />
            <span style={{ fontSize: 13, color: '#a78bfa', fontWeight: 600, fontFamily: '-apple-system, sans-serif' }}>
              feat/dashboard
            </span>
            <span style={{ fontSize: 12, color: '#a78bfa', fontFamily: '-apple-system, sans-serif' }}>
              Cursor Composer
            </span>
          </div>

          <MockTerminal
            title="Dashboard Components"
            delay={15}
            lines={[
              { text: '  Building chart components...', color: '#a78bfa', delay: 20 },
              { text: '', delay: 25 },
              { text: '  Created src/components/BarChart.tsx', color: '#94a3b8', delay: 30 },
              { text: '  Created src/components/LineChart.tsx', color: '#94a3b8', delay: 37 },
              { text: '  Created src/components/PieChart.tsx', color: '#94a3b8', delay: 44 },
              { text: '  Updated src/pages/dashboard.tsx', color: '#94a3b8', delay: 51 },
              { text: '', delay: 55 },
              { text: '  Rendering preview...', color: '#fbbf24', delay: 58 },
              { text: '  Dashboard ready at localhost:3000', color: '#34d399', delay: 65 },
            ]}
          />
        </div>
      </div>
    </AbsoluteFill>
  )
}
