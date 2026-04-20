import { Composition } from 'remotion'
import { CliStudioDemo } from './CelyDemo'

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="CliStudioDemo"
      component={CliStudioDemo}
      durationInFrames={800} // ~27 seconds at 30fps
      fps={30}
      width={1920}
      height={1080}
    />
  )
}
