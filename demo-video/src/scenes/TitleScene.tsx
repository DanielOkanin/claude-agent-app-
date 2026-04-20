import { AbsoluteFill, interpolate, useCurrentFrame, spring, useVideoConfig } from 'remotion'
import { GlowText, Badge } from '../components/GlowText'

export const TitleScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // Logo animation
  const logoScale = spring({ frame, fps, config: { damping: 10, stiffness: 100 } })
  const logoRotate = interpolate(logoScale, [0, 1], [-10, 0])

  // Exit fade
  const exitOpacity = interpolate(frame, [75, 90], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{
      backgroundColor: '#0f172a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: exitOpacity,
    }}>
      {/* Gradient orbs */}
      <div style={{
        position: 'absolute',
        width: 400, height: 400,
        borderRadius: '50%',
        background: 'radial-gradient(circle, #8b5cf640 0%, transparent 70%)',
        top: '20%', left: '30%',
        filter: 'blur(60px)',
      }} />
      <div style={{
        position: 'absolute',
        width: 300, height: 300,
        borderRadius: '50%',
        background: 'radial-gradient(circle, #6366f140 0%, transparent 70%)',
        bottom: '20%', right: '30%',
        filter: 'blur(60px)',
      }} />

      {/* Logo */}
      <div style={{
        transform: `scale(${logoScale}) rotate(${logoRotate}deg)`,
        width: 100, height: 100,
        borderRadius: 28,
        background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 30,
        boxShadow: '0 0 60px #8b5cf640',
      }}>
        <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="m6.75 7.5 3 2.25-3 2.25m4.5 0h3" />
        </svg>
      </div>

      <GlowText text="CLI Studio" size={72} delay={10} />

      <div style={{ height: 12 }} />

      <GlowText
        text="AI Coding Agents, Orchestrated"
        size={28}
        color="#94a3b8"
        delay={20}
      />

      <div style={{ height: 30 }} />

      <div style={{ display: 'flex', gap: 12 }}>
        <Badge text="Claude" color="#fb923c" delay={30} />
        <Badge text="Cursor" color="#a78bfa" delay={35} />
        <Badge text="Git Worktrees" color="#34d399" delay={40} />
        <Badge text="Features" color="#fbbf24" delay={45} />
      </div>
    </AbsoluteFill>
  )
}
