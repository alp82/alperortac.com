import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { COLORS, DURATION, STAGES, WATERMARK } from "./theme";
import { Watermark } from "./Watermark";

// Blend A — Full sequential arc (three acts, left -> right).
// Act 1: a `forge run` terminal whose lines ARE the seven stages. Act 2: embers
// cross the gap. Act 3: a comet runs the seven-stage rail (centre-right) and
// reforms the emerald artifact (right).
//
// Terminal <-> rail are locked in sync: each stage has ONE flare value
// (flareAt(NODE_X[i])), driven by the comet's position, and BOTH the terminal
// line and its rail node read that same value. Line i ignites exactly as node i
// flares — one clock, not two.

// Compressed rail lives in the centre-right band.
const NODE_X = STAGES.map((_, i) => 44 + (i * 42) / (STAGES.length - 1)); // %
const CENTER_Y = 50; // %
const SIGMA = 5;

// Terminal status text per stage — same order as STAGES.
const STAGE_STATUS = [
  "classified · L",
  "12 files read",
  "plan ready",
  "9 written",
  "██████ ok",
  "lgtm ✓",
  "deployed",
] as const;

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

// Terminal exit (right edge) and rail start, in px.
const SRC = { x: 480, y: 380 };
const railStartPx = { x: (NODE_X[0] / 100) * 1280, y: (CENTER_Y / 100) * 720 };

export const ForgeBlendA: React.FC = () => {
  const frame = useCurrentFrame();

  const pulseX = interpolate(frame, [0, DURATION], [42, 92]); // sweeps the rail band
  const cometVisible = interpolate(
    frame,
    [0, 10, DURATION - 10, DURATION],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const flareAt = (x: number) => Math.exp(-(((x - pulseX) / SIGMA) ** 2));

  // The single source of truth: one flare value per stage, shared by the
  // terminal line and the rail node.
  const flares = NODE_X.map((x) => flareAt(x));

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(120% 120% at 50% 45%, ${COLORS.emerald} 0%, ${COLORS.emeraldDeep} 60%, #01120d 100%)`,
        fontFamily: "Inter, system-ui, sans-serif",
        overflow: "hidden",
      }}
    >
      {/* Act 1 — terminal; its lines are the seven stages */}
      <div
        style={{
          position: "absolute",
          left: 60,
          top: 150,
          width: 410,
          height: 440,
          borderRadius: 12,
          background: "rgba(2, 20, 15, 0.72)",
          border: `1px solid ${COLORS.emerald}`,
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          padding: "22px 24px",
          boxSizing: "border-box",
          fontFamily: "ui-monospace, Menlo, monospace",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          {["#f87171", "#fbbf24", "#34d399"].map((c) => (
            <div key={c} style={{ width: 12, height: 12, borderRadius: "50%", background: c }} />
          ))}
          <span
            style={{
              marginLeft: 8,
              fontSize: 14,
              letterSpacing: 1,
              color: COLORS.emeraldGlow,
              opacity: 0.7,
            }}
          >
            claude code
          </span>
        </div>
        {/* Command header — the /forge slash command, always lit, kicks the run */}
        <div
          style={{
            fontSize: 18,
            lineHeight: "40px",
            opacity: 0.95,
            marginBottom: 2,
            display: "flex",
            gap: 10,
          }}
        >
          <span style={{ color: COLORS.emeraldGlow }}>❯</span>
          <span style={{ color: COLORS.gold, fontWeight: 600 }}>/forge</span>
        </div>
        {/* One line per stage, heat = that stage's shared flare */}
        {STAGES.map((label, i) => {
          const f = flares[i];
          return (
            <div
              key={label}
              style={{
                fontSize: 18,
                lineHeight: "40px",
                display: "flex",
                gap: 10,
                color: mix("34d399", "fbbf24", f),
                textShadow: f > 0.15 ? `0 0 12px ${COLORS.ember}` : "none",
                opacity: 0.55 + f * 0.45,
              }}
            >
              <span style={{ color: mix("065f46", "fb923c", f) }}>▸</span>
              <span style={{ minWidth: 96, textTransform: "lowercase" }}>{label}</span>
              <span style={{ opacity: 0.85 }}>{STAGE_STATUS[i]}</span>
            </div>
          );
        })}
      </div>

      {/* Act 2 — embers crossing the gap terminal -> rail start */}
      {[...Array(40)].map((_, i) => {
        const p = (frame / DURATION + rand(i)) % 1;
        const sx = SRC.x + (rand(i + 1) - 0.5) * 60;
        const sy = SRC.y + (rand(i + 2) - 0.5) * 220;
        const x = sx + (railStartPx.x - sx) * p;
        const bow = -110 * Math.sin(Math.PI * p) * (0.5 + rand(i + 4));
        const y = sy + (railStartPx.y - sy) * p + bow;
        const op = Math.sin(Math.PI * p);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: 6 - p * 3,
              height: 6 - p * 3,
              borderRadius: "50%",
              background: p < 0.6 ? COLORS.emberHot : COLORS.gold,
              boxShadow: `0 0 8px ${COLORS.gold}`,
              opacity: op * 0.85,
            }}
          />
        );
      })}

      {/* Act 3 — the rail */}
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

      {STAGES.map((label, i) => {
        const f = flares[i];
        const size = 24 + f * 24;
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
                boxShadow: `0 0 ${8 + f * 40}px ${f * 7}px ${color}`,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: `${NODE_X[i]}%`,
                top: `${CENTER_Y + 7}%`,
                transform: "translateX(-50%)",
                fontSize: 15,
                fontWeight: 600,
                letterSpacing: 0.5,
                color: mix("6ee7b7", "fde68a", f),
                opacity: 0.45 + f * 0.55,
              }}
            >
              {label}
            </div>
          </div>
        );
      })}

      {[0, 1, 2, 3, 4].map((t) => {
        const x = pulseX - t * 2;
        return (
          <div
            key={t}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${CENTER_Y}%`,
              width: 15 - t * 2.4,
              height: 15 - t * 2.4,
              transform: "translate(-50%, -50%)",
              borderRadius: "50%",
              background: COLORS.white,
              boxShadow: `0 0 18px 6px ${COLORS.gold}`,
              opacity: cometVisible * (1 - t * 0.18),
            }}
          />
        );
      })}

      {/* Reformed emerald artifact — far right */}
      {(() => {
        const arrive = flares[6];
        return (
          <div
            style={{
              position: "absolute",
              left: `${NODE_X[6] + 6}%`,
              top: `${CENTER_Y}%`,
              transform: "translate(-50%, -50%)",
              width: 72,
              height: 88,
              borderRadius: 12,
              background: `linear-gradient(160deg, ${COLORS.emeraldBright}, ${COLORS.emerald} 55%, ${COLORS.emeraldDeep})`,
              border: `1.5px solid ${COLORS.emeraldGlow}`,
              boxShadow: `0 0 ${16 + arrive * 38}px ${2 + arrive * 6}px ${COLORS.emeraldGlow}`,
              opacity: 0.5 + arrive * 0.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
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
