import { AbsoluteFill, interpolate, useCurrentFrame, spring, useVideoConfig } from 'remotion'
import { GlowText } from '../components/GlowText'

const DiffLine = ({ type, text, delay }: { type: 'add' | 'remove' | 'context' | 'header'; text: string; delay: number }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const slideIn = spring({ frame: frame - delay, fps, config: { damping: 15 } })
  const opacity = interpolate(slideIn, [0, 1], [0, 1])
  const translateX = interpolate(slideIn, [0, 1], [type === 'add' ? 20 : type === 'remove' ? -20 : 0, 0])

  const colors = {
    add: { bg: '#22c55e12', text: '#4ade80', prefix: '+' },
    remove: { bg: '#ef444412', text: '#f87171', prefix: '-' },
    context: { bg: 'transparent', text: '#64748b', prefix: ' ' },
    header: { bg: '#3b82f610', text: '#60a5fa', prefix: '' },
  }
  const c = colors[type]

  return (
    <div style={{
      opacity,
      transform: `translateX(${translateX}px)`,
      padding: '4px 16px',
      backgroundColor: c.bg,
      fontFamily: 'monospace',
      fontSize: 14,
      lineHeight: 1.8,
      color: c.text,
      borderLeft: type === 'add' ? '3px solid #22c55e40' : type === 'remove' ? '3px solid #ef444440' : '3px solid transparent',
    }}>
      <span style={{ opacity: 0.5, marginRight: 12, userSelect: 'none' }}>{c.prefix}</span>
      {text}
    </div>
  )
}

const FileTab = ({ name, active, delay }: { name: string; active?: boolean; delay: number }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const pop = spring({ frame: frame - delay, fps, config: { damping: 12 } })

  return (
    <div style={{
      transform: `scale(${pop})`,
      padding: '8px 16px',
      backgroundColor: active ? '#1e293b' : '#0f172a',
      borderBottom: active ? '2px solid #3b82f6' : '2px solid transparent',
      color: active ? '#e2e8f0' : '#64748b',
      fontSize: 13,
      fontWeight: active ? 600 : 400,
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
    }}>
      <span style={{ color: active ? '#4ade80' : '#64748b', fontSize: 11 }}>M</span>
      {name}
    </div>
  )
}

export const DiffViewerScene: React.FC = () => {
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
        <GlowText text="Built-in Diff Viewer" size={36} color="#60a5fa" delay={0} />
      </div>

      {/* Diff window */}
      <div style={{
        flex: 1,
        margin: '0 60px 40px',
        backgroundColor: '#0d1526',
        borderRadius: 16,
        border: '1px solid #1e293b',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
      }}>
        {/* Window controls */}
        <div style={{
          padding: '12px 16px',
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ef4444' }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#eab308' }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#22c55e' }} />
          </div>
          <span style={{ fontSize: 12, color: '#64748b', marginLeft: 8 }}>Changed Files — 3 modified</span>
        </div>

        {/* File tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #1e293b',
          backgroundColor: '#0a1120',
        }}>
          <FileTab name="src/auth/oauth.ts" active delay={8} />
          <FileTab name="src/routes/login.ts" delay={12} />
          <FileTab name="package.json" delay={16} />
        </div>

        {/* Diff header */}
        <DiffLine type="header" text="@@ -15,8 +15,22 @@ export class AuthService {" delay={18} />

        {/* Diff content */}
        <div style={{ flex: 1, padding: '4px 0' }}>
          <DiffLine type="context" text="  private config: AuthConfig;" delay={20} />
          <DiffLine type="context" text="  private tokenStore: TokenStore;" delay={22} />
          <DiffLine type="context" text="" delay={23} />
          <DiffLine type="remove" text="  async authenticate(credentials: BasicAuth): Promise<Session> {" delay={26} />
          <DiffLine type="remove" text="    const user = await this.db.findUser(credentials.email);" delay={29} />
          <DiffLine type="remove" text="    if (!user || !verify(credentials.password, user.hash)) {" delay={32} />
          <DiffLine type="remove" text="      throw new AuthError('Invalid credentials');" delay={35} />
          <DiffLine type="remove" text="    }" delay={37} />
          <DiffLine type="add" text="  async authenticate(provider: OAuthProvider): Promise<Session> {" delay={40} />
          <DiffLine type="add" text="    const { code, state } = await provider.authorize();" delay={43} />
          <DiffLine type="add" text="    const tokens = await provider.exchangeCode(code);" delay={46} />
          <DiffLine type="add" text="    const profile = await provider.getProfile(tokens.accessToken);" delay={49} />
          <DiffLine type="add" text="" delay={51} />
          <DiffLine type="add" text="    const user = await this.db.upsertUser({" delay={53} />
          <DiffLine type="add" text="      email: profile.email," delay={55} />
          <DiffLine type="add" text="      name: profile.name," delay={57} />
          <DiffLine type="add" text="      avatar: profile.avatar," delay={59} />
          <DiffLine type="add" text="      provider: provider.id," delay={61} />
          <DiffLine type="add" text="    });" delay={63} />
          <DiffLine type="context" text="" delay={65} />
          <DiffLine type="context" text="    return this.createSession(user);" delay={67} />
          <DiffLine type="context" text="  }" delay={69} />
        </div>

        {/* Status bar */}
        <div style={{
          padding: '8px 16px',
          borderTop: '1px solid #1e293b',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          fontSize: 12,
          fontFamily: '-apple-system, sans-serif',
        }}>
          <span style={{ color: '#4ade80' }}>+9 additions</span>
          <span style={{ color: '#f87171' }}>-5 deletions</span>
          <span style={{ color: '#64748b', marginLeft: 'auto' }}>src/auth/oauth.ts</span>
        </div>
      </div>
    </AbsoluteFill>
  )
}
