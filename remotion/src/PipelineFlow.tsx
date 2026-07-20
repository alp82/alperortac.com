import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { COLORS, DURATION, STAGES, WATERMARK } from "./theme";
import { Watermark } from "./Watermark";

// Concept 2 — Pipeline flow.
// The seven Forge stages sit on a chain; a comet of energy sweeps left->right,
// flaring each stage emerald->gold as it passes, then exits for a seamless loop.

const NODE_X = STAGES.map((_, i) => 8 + (i * 84) / (STAGES.length - 1)); // % across
const CENTER_Y = 46; // %
const SIGMA = 5.5; // flare half-width in %

const mix = (a: string, b: string, t: number) => {
  const pa = a.match(/\w\w/g)!.map((h) => parseInt(h, 16));
  const pb = b.match(/\w\w/g)!.map((h) => parseInt(h, 16));
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
};

export const PipelineFlow: React.FC = () => {
  const frame = useCurrentFrame();

  // Comet sweeps from just off the left to just off the right.
  const pulseX = interpolate(frame, [0, DURATION], [-16, 116]);
  const cometVisible = interpolate(
    frame,
    [0, 8, DURATION - 8, DURATION],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const flareAt = (x: number) =>
    Math.exp(-(((x - pulseX) / SIGMA) ** 2));

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(120% 120% at 50% 40%, ${COLORS.emerald} 0%, ${COLORS.emeraldDeep} 60%, #01120d 100%)`,
        fontFamily: "Inter, system-ui, sans-serif",
        overflow: "hidden",
      }}
    >
      {/* Base rail */}
      <div
        style={{
          position: "absolute",
          left: `${NODE_X[0]}%`,
          right: `${100 - NODE_X[NODE_X.length - 1]}%`,
          top: `${CENTER_Y}%`,
          height: 3,
          transform: "translateY(-50%)",
          background: "rgba(52,211,153,0.22)",
        }}
      />
      {/* Lit rail up to the comet */}
      <div
        style={{
          position: "absolute",
          left: `${NODE_X[0]}%`,
          width: `${Math.max(0, Math.min(NODE_X[6], pulseX) - NODE_X[0])}%`,
          top: `${CENTER_Y}%`,
          height: 3,
          transform: "translateY(-50%)",
          background: `linear-gradient(90deg, transparent, ${COLORS.gold})`,
          opacity: cometVisible,
          filter: "blur(0.5px)",
        }}
      />

      {/* Nodes */}
      {STAGES.map((label, i) => {
        const f = flareAt(NODE_X[i]);
        const size = 30 + f * 26;
        const color = mix("10b981", "fbbf24", f);
        return (
          <div key={label}>
            <div
              style={{
                position: "absolute",
                left: `${NODE_X[i]}%`,
                top: `${CENTER_Y}%`,
                width: size,
                height: size,
                transform: "translate(-50%, -50%)",
                borderRadius: "50%",
                border: `3px solid ${color}`,
                background: `radial-gradient(circle, ${color} ${20 + f * 60}%, transparent 72%)`,
                boxShadow: `0 0 ${8 + f * 44}px ${f * 8}px ${color}`,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: `${NODE_X[i]}%`,
                top: `${CENTER_Y + 8}%`,
                transform: "translateX(-50%)",
                fontSize: 20,
                fontWeight: 600,
                letterSpacing: 1,
                color: mix("6ee7b7", "fde68a", f),
                opacity: 0.55 + f * 0.45,
              }}
            >
              {label}
            </div>
          </div>
        );
      })}

      {/* The comet + trail */}
      {[0, 1, 2, 3, 4].map((t) => {
        const x = pulseX - t * 2.4;
        return (
          <div
            key={t}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${CENTER_Y}%`,
              width: 16 - t * 2.5,
              height: 16 - t * 2.5,
              transform: "translate(-50%, -50%)",
              borderRadius: "50%",
              background: COLORS.white,
              boxShadow: `0 0 20px 6px ${COLORS.gold}`,
              opacity: cometVisible * (1 - t * 0.18),
            }}
          />
        );
      })}

      <Watermark text={WATERMARK} />
    </AbsoluteFill>
  );
};
