import { interpolate, useCurrentFrame, spring, useVideoConfig } from 'remotion'

export const GlowText = ({ text, delay = 0, size = 48, color = '#fff' }: {
  text: string; delay?: number; size?: number; color?: string
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const entrance = spring({ frame: frame - delay, fps, config: { damping: 12 } })
  const opacity = interpolate(entrance, [0, 1], [0, 1])
  const translateY = interpolate(entrance, [0, 1], [30, 0])

  return (
    <div style={{
      opacity,
      transform: `translateY(${translateY}px)`,
      fontSize: size,
      fontWeight: 800,
      color,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      letterSpacing: -1.5,
      textShadow: `0 0 40px ${color}40, 0 0 80px ${color}20`,
    }}>
      {text}
    </div>
  )
}

export const Badge = ({ text, color, delay = 0 }: { text: string; color: string; delay?: number }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const pop = spring({ frame: frame - delay, fps, config: { damping: 10, stiffness: 200 } })
  const scale = interpolate(pop, [0, 1], [0, 1])

  return (
    <div style={{
      transform: `scale(${scale})`,
      padding: '8px 20px',
      borderRadius: 50,
      backgroundColor: `${color}20`,
      border: `1px solid ${color}40`,
      color,
      fontSize: 16,
      fontWeight: 600,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      {text}
    </div>
  )
}
