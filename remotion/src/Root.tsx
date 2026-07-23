import { Composition } from "remotion";
import { DURATION, FPS, HEIGHT, WIDTH } from "./theme";
import { PipelineFlow } from "./PipelineFlow";
import { CodeEmberStream } from "./CodeEmberStream";
import { ForgeBlendB } from "./ForgeBlendB";
import { ForgeBlendA } from "./ForgeBlendA";
import { ForgeBlendC } from "./ForgeBlendC";

// Forge-panel loop concepts to walk in Remotion Studio (wayfinder #29).
// Round 2: PipelineFlow + CodeEmberStream survived; Alper asked to blend them.
// Three blends to walk (top of the sidebar); the two survivors kept below as
// reference. Each is a seamless 4s loop.
const common = {
  durationInFrames: DURATION,
  fps: FPS,
  width: WIDTH,
  height: HEIGHT,
} as const;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="Blend-B-CometFromCode" component={ForgeBlendB} {...common} />
      <Composition id="Blend-A-SequentialArc" component={ForgeBlendA} {...common} />
      <Composition id="Blend-C-EmberMedium" component={ForgeBlendC} {...common} />
      <Composition id="ref-PipelineFlow" component={PipelineFlow} {...common} />
      <Composition id="ref-CodeEmberStream" component={CodeEmberStream} {...common} />
    </>
  );
};
