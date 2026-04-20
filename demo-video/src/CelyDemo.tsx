import { AbsoluteFill, Sequence } from 'remotion'
import { TitleScene } from './scenes/TitleScene'
import { FeatureGroupsScene } from './scenes/FeatureGroupsScene'
import { BranchCreationScene } from './scenes/BranchCreationScene'
import { ParallelAgentsScene } from './scenes/ParallelAgentsScene'
import { DiffViewerScene } from './scenes/DiffViewerScene'
import { PlanViewerScene } from './scenes/PlanViewerScene'
import { AgentCollabScene } from './scenes/AgentCollabScene'
import { EndScene } from './scenes/EndScene'

export const CliStudioDemo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#0f172a' }}>
      {/* Scene 1: Title card (0-90 = 0-3s) */}
      <Sequence from={0} durationInFrames={90}>
        <TitleScene />
      </Sequence>

      {/* Scene 2: Feature groups (90-200 = 3-6.7s) */}
      <Sequence from={90} durationInFrames={110}>
        <FeatureGroupsScene />
      </Sequence>

      {/* Scene 3: Branch creation (200-300 = 6.7-10s) */}
      <Sequence from={200} durationInFrames={100}>
        <BranchCreationScene />
      </Sequence>

      {/* Scene 4: Parallel agents (300-400 = 10-13.3s) */}
      <Sequence from={300} durationInFrames={100}>
        <ParallelAgentsScene />
      </Sequence>

      {/* Scene 5: Diff viewer (400-510 = 13.3-17s) */}
      <Sequence from={400} durationInFrames={110}>
        <DiffViewerScene />
      </Sequence>

      {/* Scene 6: Plan viewer (510-620 = 17-20.7s) */}
      <Sequence from={510} durationInFrames={110}>
        <PlanViewerScene />
      </Sequence>

      {/* Scene 7: Agent collaboration (620-730 = 20.7-24.3s) */}
      <Sequence from={620} durationInFrames={110}>
        <AgentCollabScene />
      </Sequence>

      {/* Scene 8: End card (730-800 = 24.3-26.7s) */}
      <Sequence from={730} durationInFrames={70}>
        <EndScene />
      </Sequence>
    </AbsoluteFill>
  )
}
