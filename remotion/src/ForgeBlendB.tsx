import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { COLORS, DURATION, STAGES, WATERMARK } from "./theme";
import { Watermark } from "./Watermark";

// Blend B — Comet born of code (rail-dominant).
// PipelineFlow's seven-stage rail is the spine. A compact `forge run` terminal
// ignites top-left; embers stream out of it and gather into the comet, which
// then sweeps the rail (flaring each stage emerald->gold) and reforms the
// artifact at the right. Terminal + embers + rail + artifact, rail dominant.

const NODE_X = STAGES.map((_, i) => 12 + (i * 78) / (STAGES.length - 1)); // %
const CENTER_Y = 52; // %
const SIGMA = 5.5;

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

const LINES = ["$ forge run", "▸ intent  · L", "▸ build ██ ok"];

// Terminal exit (where embers are born) and rail start (where the comet lives).
const SRC = { x: 300, y: 205 };
const RAIL_START = { xPct: NODE_X[0], yPct: CENTER_Y };

export const ForgeBlendB: React.FC = () => {
  const frame = useCurrentFrame();

  const pulseX = interpolate(frame, [0, DURATION], [-16, 116]);
  const cometVisible = interpolate(
    frame,
    [0, 8, DURATION - 8, DURATION],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const flareAt = (x: number) => Math.exp(-(((x - pulseX) / SIGMA) ** 2));

  // Terminal ignite band loops on DURATION.
  const bandY = 168 + ((frame / DURATION) % 1) * 120;

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(120% 120% at 50% 40%, ${COLORS.emerald} 0%, ${COLORS.emeraldDeep} 60%, #01120d 100%)`,
        fontFamily: "Inter, system-ui, sans-serif",
        overflow: "hidden",
      }}
    >
      {/* Compact terminal — the comet's birthplace */}
      <div
        style={{
          position: "absolute",
          left: 70,
          top: 120,
          width: 320,
          height: 150,
          borderRadius: 12,
          background: "rgba(2, 20, 15, 0.72)",
          border: `1px solid ${COLORS.emerald}`,
          boxShadow: "0 16px 44px rgba(0,0,0,0.5)",
          padding: "18px 22px",
          boxSizing: "border-box",
          fontFamily: "ui-monospace, Menlo, monospace",
        }}
      >
        <div style={{ display: "flex", gap: 7, marginBottom: 14 }}>
          {["#f87171", "#fbbf24", "#34d399"].map((c) => (
            <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />
          ))}
        </div>
        {LINES.map((ln, i) => {
          const lineY = 158 + i * 30;
          const heat = Math.max(0, 1 - Math.abs(lineY - bandY) / 30);
          return (
            <div
              key={i}
              style={{
                fontSize: 18,
                lineHeight: "30px",
                color: heat > 0.1 ? COLORS.gold : COLORS.emeraldGlow,
                textShadow: heat > 0.1 ? `0 0 12px ${COLORS.ember}` : "none",
                opacity: 0.62 + heat * 0.38,
              }}
            >
              {ln}
            </div>
          );
        })}
      </div>

      {/* Embers streaming terminal -> rail start (feeds the comet) */}
      {[...Array(30)].map((_, i) => {
        const p = (frame / DURATION + rand(i)) % 1;
        const sx = SRC.x + (rand(i + 1) - 0.5) * 40;
        const sy = SRC.y + (rand(i + 2) - 0.5) * 40;
        const tx = (RAIL_START.xPct / 100) * 1280;
        const ty = (RAIL_START.yPct / 100) * 720;
        const x = sx + (tx - sx) * p;
        const bow = -70 * Math.sin(Math.PI * p) * (0.5 + rand(i + 4));
        const y = sy + (ty - sy) * p + bow;
        const op = Math.sin(Math.PI * p);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: 5 - p * 2.5,
              height: 5 - p * 2.5,
              borderRadius: "50%",
              background: p < 0.55 ? COLORS.emberHot : COLORS.gold,
              boxShadow: `0 0 7px ${COLORS.gold}`,
              opacity: op * 0.85,
            }}
          />
        );
      })}

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

      {/* Stage nodes */}
      {STAGES.map((label, i) => {
        const f = flareAt(NODE_X[i]);
        const size = 28 + f * 26;
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

      {/* Comet + trail */}
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

      {/* Artifact reforming at the rail's end — brightens as the comet arrives */}
      {(() => {
        const arrive = flareAt(NODE_X[6]); // hot when comet reaches Ship
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
              opacity: 0.55 + arrive * 0.45,
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
