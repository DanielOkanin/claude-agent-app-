import { AbsoluteFill, interpolate, useCurrentFrame, spring, useVideoConfig } from 'remotion'
import { GlowText } from '../components/GlowText'

export const EndScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const fadeIn = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' })

  // Logo pulse
  const pulse = interpolate(frame % 30, [0, 15, 30], [1, 1.05, 1])

  const linkSpring = spring({ frame: frame - 25, fps, config: { damping: 12 } })
  const linkOpacity = interpolate(linkSpring, [0, 1], [0, 1])
  const linkY = interpolate(linkSpring, [0, 1], [20, 0])

  return (
    <AbsoluteFill style={{
      backgroundColor: '#0f172a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: fadeIn,
    }}>
      {/* Gradient background */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(circle at 50% 50%, #8b5cf615 0%, transparent 60%)',
      }} />

      {/* Logo */}
      <div style={{
        transform: `scale(${pulse})`,
        width: 80, height: 80,
        borderRadius: 22,
        background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 24,
        boxShadow: '0 0 80px #8b5cf650',
      }}>
        <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="m6.75 7.5 3 2.25-3 2.25m4.5 0h3" />
        </svg>
      </div>

      <GlowText text="CLI Studio" size={56} delay={5} />

      <div style={{ height: 8 }} />

      <GlowText text="Your AI agents, one app." size={24} color="#94a3b8" delay={10} />

      <div style={{ height: 32 }} />

      {/* GitHub link */}
      <div style={{
        opacity: linkOpacity,
        transform: `translateY(${linkY}px)`,
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '14px 32px',
        backgroundColor: '#1e293b',
        border: '1px solid #334155',
        borderRadius: 50,
        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#e2e8f0">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
        </svg>
        <span style={{ color: '#e2e8f0', fontSize: 16, fontWeight: 600 }}>github.com/DanielOkanin/cli-studio</span>
      </div>
    </AbsoluteFill>
  )
}
