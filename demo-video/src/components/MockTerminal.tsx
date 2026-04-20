import { interpolate, useCurrentFrame, spring, useVideoConfig } from 'remotion'

interface TerminalLine {
  text: string
  color?: string
  delay: number
  typing?: boolean
}

const TypedLine = ({ line }: { line: TerminalLine }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  if (frame < line.delay) return null

  const elapsed = frame - line.delay
  const opacity = interpolate(elapsed, [0, 3], [0, 1], { extrapolateRight: 'clamp' })

  if (line.typing) {
    const charsToShow = Math.min(Math.floor(elapsed * 1.2), line.text.length)
    const displayText = line.text.substring(0, charsToShow)
    const showCursor = elapsed % 15 < 10 && charsToShow < line.text.length

    return (
      <div style={{ opacity, fontSize: 13, lineHeight: 1.7, color: line.color || '#e2e8f0', fontFamily: 'monospace' }}>
        {displayText}
        {showCursor && <span style={{ backgroundColor: '#e2e8f0', color: '#0f172a' }}>&nbsp;</span>}
      </div>
    )
  }

  return (
    <div style={{ opacity, fontSize: 13, lineHeight: 1.7, color: line.color || '#e2e8f0', fontFamily: 'monospace' }}>
      {line.text}
    </div>
  )
}

export const MockTerminal = ({ lines, title, delay = 0 }: { lines: TerminalLine[]; title?: string; delay?: number }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const scaleIn = spring({ frame: frame - delay, fps, config: { damping: 15 } })
  const opacity = interpolate(scaleIn, [0, 1], [0, 1])
  const scale = interpolate(scaleIn, [0, 1], [0.95, 1])

  return (
    <div style={{
      opacity,
      transform: `scale(${scale})`,
      flex: 1,
      backgroundColor: '#0d1526',
      borderRadius: 12,
      border: '1px solid #1e293b',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Title bar */}
      <div style={{
        padding: '10px 16px',
        borderBottom: '1px solid #1e293b',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#0d1526',
      }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ef4444' }} />
          <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#eab308' }} />
          <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#22c55e' }} />
        </div>
        {title && (
          <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 8 }}>{title}</span>
        )}
      </div>

      {/* Terminal content */}
      <div style={{ flex: 1, padding: 20 }}>
        {lines.map((line, i) => (
          <TypedLine key={i} line={line} />
        ))}
      </div>
    </div>
  )
}
