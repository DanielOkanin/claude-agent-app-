import { AbsoluteFill, interpolate, useCurrentFrame, spring, useVideoConfig } from 'remotion'
import { GlowText } from '../components/GlowText'

const PlanStep = ({ text, status, delay, indent = 0 }: {
  text: string; status: 'done' | 'active' | 'pending'; delay: number; indent?: number
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const slideIn = spring({ frame: frame - delay, fps, config: { damping: 14 } })
  const opacity = interpolate(slideIn, [0, 1], [0, 1])
  const translateX = interpolate(slideIn, [0, 1], [30, 0])

  const checkmarkScale = status === 'done'
    ? spring({ frame: frame - delay - 8, fps, config: { damping: 8, stiffness: 200 } })
    : 0

  const pulseOpacity = status === 'active'
    ? interpolate((frame - delay) % 30, [0, 15, 30], [0.5, 1, 0.5])
    : 1

  return (
    <div style={{
      opacity,
      transform: `translateX(${translateX}px)`,
      padding: '10px 0',
      paddingLeft: indent * 24,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
    }}>
      {/* Checkbox */}
      <div style={{
        width: 22, height: 22, borderRadius: 6,
        border: status === 'done' ? '2px solid #22c55e' : status === 'active' ? '2px solid #eab308' : '2px solid #334155',
        backgroundColor: status === 'done' ? '#22c55e15' : status === 'active' ? '#eab30815' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        opacity: pulseOpacity,
      }}>
        {status === 'done' && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3"
            style={{ transform: `scale(${checkmarkScale})` }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
        {status === 'active' && (
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            backgroundColor: '#eab308',
            opacity: pulseOpacity,
          }} />
        )}
      </div>

      {/* Text */}
      <span style={{
        fontSize: 15,
        color: status === 'done' ? '#94a3b8' : status === 'active' ? '#fbbf24' : '#475569',
        textDecoration: status === 'done' ? 'line-through' : 'none',
        fontWeight: status === 'active' ? 600 : 400,
        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      }}>
        {text}
      </span>

      {/* Status label */}
      {status === 'active' && (
        <span style={{
          fontSize: 11,
          padding: '2px 8px',
          borderRadius: 20,
          backgroundColor: '#eab30820',
          color: '#fbbf24',
          fontWeight: 600,
          marginLeft: 'auto',
          fontFamily: '-apple-system, sans-serif',
        }}>In progress</span>
      )}
    </div>
  )
}

export const PlanViewerScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const enterOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' })
  const exitOpacity = interpolate(frame, [85, 100], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  // Progressive completion
  const step1Done = frame > 30
  const step2Done = frame > 45
  const step3Active = frame > 50
  const step4Pending = true

  const progressWidth = interpolate(frame, [20, 70], [0, 65], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{
      backgroundColor: '#0f172a',
      opacity: enterOpacity * exitOpacity,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Caption */}
      <div style={{ padding: '40px 0 20px', display: 'flex', justifyContent: 'center' }}>
        <GlowText text="Live Plan Tracking" size={36} color="#c084fc" delay={0} />
      </div>

      {/* Plan card */}
      <div style={{
        flex: 1,
        margin: '0 200px 40px',
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
          padding: '20px 28px',
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c084fc" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
            </svg>
            <span style={{
              fontSize: 18, fontWeight: 700, color: '#e2e8f0',
              fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
            }}>OAuth Integration Plan</span>
          </div>
          <div style={{
            fontSize: 13, color: '#94a3b8',
            fontFamily: '-apple-system, sans-serif',
          }}>
            <span style={{ color: '#c084fc', fontWeight: 600 }}>Opus 4.7</span> · feat/auth
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ padding: '16px 28px 8px' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 8,
          }}>
            <span style={{ fontSize: 12, color: '#64748b', fontFamily: '-apple-system, sans-serif' }}>Progress</span>
            <span style={{ fontSize: 12, color: '#c084fc', fontWeight: 600, fontFamily: '-apple-system, sans-serif' }}>
              {Math.round(progressWidth)}%
            </span>
          </div>
          <div style={{
            height: 6, backgroundColor: '#1e293b', borderRadius: 3, overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${progressWidth}%`,
              background: 'linear-gradient(90deg, #c084fc, #8b5cf6)',
              borderRadius: 3,
              transition: 'width 0.3s',
            }} />
          </div>
        </div>

        {/* Plan steps */}
        <div style={{ flex: 1, padding: '12px 28px' }}>
          <PlanStep text="Set up OAuth provider configuration" status={step1Done ? 'done' : 'active'} delay={10} />
          <PlanStep text="Create Google OAuth provider" status={step2Done ? 'done' : step1Done ? 'active' : 'pending'} delay={15} indent={1} />
          <PlanStep text="Create GitHub OAuth provider" status={step2Done ? 'done' : 'pending'} delay={20} indent={1} />
          <PlanStep text="Implement token exchange & session creation" status={step3Active ? 'active' : 'pending'} delay={25} />
          <PlanStep text="Add callback route handlers" status={step3Active ? 'active' : 'pending'} delay={30} indent={1} />
          <PlanStep text="Store refresh tokens securely" status="pending" delay={35} indent={1} />
          <PlanStep text="Add logout & token revocation" status="pending" delay={40} />
          <PlanStep text="Write integration tests" status="pending" delay={45} />
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 28px',
          borderTop: '1px solid #1e293b',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 12,
          color: '#64748b',
          fontFamily: '-apple-system, sans-serif',
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#eab308', animation: 'pulse 2s infinite' }} />
          Agent is working on step 4...
          <span style={{ marginLeft: 'auto', color: '#475569' }}>Updated 3s ago</span>
        </div>
      </div>
    </AbsoluteFill>
  )
}
