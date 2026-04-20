import { AbsoluteFill, interpolate, useCurrentFrame, spring, useVideoConfig } from 'remotion'
import { GlowText } from '../components/GlowText'

export const BranchCreationScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const enterOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' })
  const exitOpacity = interpolate(frame, [85, 100], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  // Animated form elements
  const formScale = spring({ frame: frame - 10, fps, config: { damping: 12 } })
  const branchTyping = Math.min(Math.floor((frame - 30) * 0.8), 'feat/payment-flow'.length)
  const showBaseBranch = frame > 50
  const showButton = frame > 60
  const buttonClick = frame > 70
  const successPop = spring({ frame: frame - 75, fps, config: { damping: 8, stiffness: 200 } })

  return (
    <AbsoluteFill style={{
      backgroundColor: '#0f172a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: enterOpacity * exitOpacity,
    }}>
      {/* Caption */}
      <div style={{ position: 'absolute', top: 60, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <GlowText text="One-Click Branch & Worktree" size={36} color="#34d399" delay={0} />
      </div>

      {/* Form card */}
      <div style={{
        transform: `scale(${formScale})`,
        width: 420,
        backgroundColor: '#1e293b',
        borderRadius: 16,
        border: '1px solid #334155',
        padding: 32,
        boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
      }}>
        <div style={{
          fontSize: 14, color: '#94a3b8', fontWeight: 600, marginBottom: 16,
          fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
        }}>New Chat on Branch</div>

        {/* Branch name input */}
        <div style={{
          padding: '12px 16px',
          backgroundColor: '#0f172a',
          borderRadius: 10,
          border: '1px solid #334155',
          marginBottom: 12,
          fontFamily: 'monospace',
          fontSize: 14,
          color: '#e2e8f0',
          display: 'flex',
          alignItems: 'center',
        }}>
          {frame > 30 ? 'feat/payment-flow'.substring(0, branchTyping) : ''}
          {frame > 30 && branchTyping < 'feat/payment-flow'.length && frame % 15 < 10 && (
            <span style={{ backgroundColor: '#e2e8f0', color: '#0f172a', width: 2, height: 18, display: 'inline-block' }} />
          )}
          {frame <= 30 && (
            <span style={{ color: '#475569' }}>Branch name (e.g. feature/auth)</span>
          )}
        </div>

        {/* Base branch selector */}
        <div style={{
          opacity: showBaseBranch ? 1 : 0,
          transition: 'opacity 0.3s',
          marginBottom: 16,
        }}>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6, fontFamily: '-apple-system, sans-serif' }}>Base branch</div>
          <div style={{
            padding: '10px 16px',
            backgroundColor: '#0f172a',
            borderRadius: 10,
            border: '1px solid #334155',
            fontSize: 13,
            color: '#e2e8f0',
            fontFamily: 'monospace',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span>main</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Create button */}
        <div style={{
          opacity: showButton ? 1 : 0,
          display: 'flex', gap: 10,
        }}>
          <div style={{
            flex: 1, padding: '12px 0', borderRadius: 10, textAlign: 'center',
            fontSize: 13, color: '#94a3b8',
            fontFamily: '-apple-system, sans-serif',
          }}>Cancel</div>
          <div style={{
            flex: 1, padding: '12px 0', borderRadius: 10, textAlign: 'center',
            backgroundColor: buttonClick ? '#1d4ed8' : '#2563eb',
            transform: buttonClick ? `scale(${0.95 + successPop * 0.05})` : 'scale(1)',
            color: '#fff', fontSize: 13, fontWeight: 600,
            fontFamily: '-apple-system, sans-serif',
          }}>
            {buttonClick ? 'Creating...' : 'Create'}
          </div>
        </div>
      </div>

      {/* Success indicator */}
      {frame > 78 && (
        <div style={{
          marginTop: 24,
          transform: `scale(${successPop})`,
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 24px',
          backgroundColor: '#34d39920',
          border: '1px solid #34d39940',
          borderRadius: 50,
          fontFamily: '-apple-system, sans-serif',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span style={{ color: '#34d399', fontSize: 15, fontWeight: 600 }}>Worktree created on feat/payment-flow</span>
        </div>
      )}
    </AbsoluteFill>
  )
}
