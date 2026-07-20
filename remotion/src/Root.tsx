import { Composition } from "remotion";
import { DURATION, FPS, HEIGHT, WIDTH } from "./theme";
import { MoltenForge } from "./MoltenForge";
import { PipelineFlow } from "./PipelineFlow";
import { RawForgedMorph } from "./RawForgedMorph";
import { CodeEmberStream } from "./CodeEmberStream";

// Four Forge-panel loop concepts to walk in Remotion Studio (wayfinder #29).
// Switch between them in the left sidebar; each is a seamless 4s loop.
const common = {
  durationInFrames: DURATION,
  fps: FPS,
  width: WIDTH,
  height: HEIGHT,
} as const;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="MoltenForge" component={MoltenForge} {...common} />
      <Composition id="PipelineFlow" component={PipelineFlow} {...common} />
      <Composition id="RawForgedMorph" component={RawForgedMorph} {...common} />
      <Composition id="CodeEmberStream" component={CodeEmberStream} {...common} />
    </>
  );
};
