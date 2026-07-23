import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { COLORS, DURATION, STAGES, WATERMARK } from "./theme";
import { Watermark } from "./Watermark";

// Blend C — Embers as the medium (no terminal).
// PipelineFlow's seven-stage rail, but the travelling energy is a STREAM of
// embers instead of a solid comet. The ember cloud drifts left -> right along
// the rail; each stage flares emerald->gold as the cloud passes, reforming into
// the artifact at the end. The leanest, most delicate fusion — rail structure
// wearing CodeEmberStream's particle skin.

const NODE_X = STAGES.map((_, i) => 12 + (i * 78) / (STAGES.length - 1)); // %
const CENTER_Y = 50; // %
const SIGMA = 6;

const mix = (a: string, b: string, t: number) => {
  const pa = a.match(/\w\w/g)!.map((h) => parseInt(h, 16));
  const pb = b.match(/\w\w/g)!.map((h) => parseInt(h, 16));
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
};

const rand = (s: number) => {
  const x = Math.sin(s * 57.31) * 43758.5453;
  return x - Math.floor(x);
};

const N = 46; // embers in the drifting cloud

export const ForgeBlendC: React.FC = () => {
  const frame = useCurrentFrame();

  // Cloud centre drifts off-screen left to off-screen right (seamless: both ends hidden).
  const cloudX = interpolate(frame, [0, DURATION], [-6, 106]);
  const cloudVisible = interpolate(
    frame,
    [0, 10, DURATION - 10, DURATION],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const flareAt = (x: number) => Math.exp(-(((x - cloudX) / SIGMA) ** 2));

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(120% 120% at 50% 42%, ${COLORS.emerald} 0%, ${COLORS.emeraldDeep} 60%, #01120d 100%)`,
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
      {/* Lit rail up to the cloud */}
      <div
        style={{
          position: "absolute",
          left: `${NODE_X[0]}%`,
          width: `${Math.max(0, Math.min(NODE_X[6], cloudX) - NODE_X[0])}%`,
          top: `${CENTER_Y}%`,
          height: 3,
          transform: "translateY(-50%)",
          background: `linear-gradient(90deg, transparent, ${COLORS.ember})`,
          opacity: cloudVisible,
          filter: "blur(0.5px)",
        }}
      />

      {/* Stage nodes — flare as the ember cloud drifts past */}
      {STAGES.map((label, i) => {
        const f = flareAt(NODE_X[i]);
        const size = 28 + f * 24;
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
                boxShadow: `0 0 ${8 + f * 42}px ${f * 8}px ${color}`,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: `${NODE_X[i]}%`,
                top: `${CENTER_Y + 8}%`,
                transform: "translateX(-50%)",
                fontSize: 18,
                fontWeight: 600,
                letterSpacing: 1,
                color: mix("6ee7b7", "fde68a", f),
                opacity: 0.5 + f * 0.5,
              }}
            >
              {label}
            </div>
          </div>
        );
      })}

      {/* The drifting ember cloud — the "energy" itself */}
      {[...Array(N)].map((_, i) => {
        // Each ember orbits the cloud centre with a looping flicker phase.
        const phase = (frame / DURATION + rand(i)) % 1;
        const spreadX = (rand(i + 1) - 0.5) * 9; // % around centre
        const spreadY = (rand(i + 2) - 0.5) * 90; // px vertical scatter
        const flick = 0.5 + 0.5 * Math.sin((phase + rand(i + 3)) * Math.PI * 2);
        const x = cloudX + spreadX;
        const y = (CENTER_Y / 100) * 720 + spreadY * (0.4 + 0.6 * flick);
        const hot = flick > 0.55;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: y,
              width: 3 + flick * 4,
              height: 3 + flick * 4,
              transform: "translate(-50%, -50%)",
              borderRadius: "50%",
              background: hot ? COLORS.white : COLORS.emberHot,
              boxShadow: `0 0 ${6 + flick * 10}px ${hot ? COLORS.gold : COLORS.ember}`,
              opacity: cloudVisible * (0.35 + flick * 0.55),
            }}
          />
        );
      })}

      {/* Artifact reforming at the end — brightens as the cloud arrives */}
      {(() => {
        const arrive = flareAt(NODE_X[6]);
        return (
          <div
            style={{
              position: "absolute",
              left: `${NODE_X[6] + 7}%`,
              top: `${CENTER_Y}%`,
              transform: "translate(-50%, -50%)",
              width: 76,
              height: 92,
              borderRadius: 12,
              background: `linear-gradient(160deg, ${COLORS.emeraldBright}, ${COLORS.emerald} 55%, ${COLORS.emeraldDeep})`,
              border: `1.5px solid ${COLORS.emeraldGlow}`,
              boxShadow: `0 0 ${18 + arrive * 40}px ${2 + arrive * 6}px ${COLORS.emeraldGlow}`,
              opacity: 0.5 + arrive * 0.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 26,
              color: COLORS.white,
            }}
          >
            ◆
          </div>
        );
      })()}

      <Watermark text={WATERMARK} />
    </AbsoluteFill>
  );
};
