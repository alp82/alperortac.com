import { AbsoluteFill, useCurrentFrame } from "remotion";
import { COLORS, DURATION, WATERMARK } from "./theme";
import { Watermark } from "./Watermark";

// Concept 4 — Code -> ember stream.
// Terminal lines ignite into a rising ember stream that reforms into a structured
// emerald artifact on the right. Particles loop on the composition period => seamless.

const rand = (s: number) => {
  const x = Math.sin(s * 57.31) * 43758.5453;
  return x - Math.floor(x);
};

const LINES = [
  "$ forge run \"add auth\"",
  "▸ intent   classified · L",
  "▸ scout    12 files read",
  "▸ blueprint  plan ready",
  "▸ tests    9 written",
  "▸ build    ██████ done",
];

const N = 54;
const TARGET = { x: 900, y: 360 };

export const CodeEmberStream: React.FC = () => {
  const frame = useCurrentFrame();

  // Ignite band sweeping down the terminal (loops on DURATION).
  const bandY = 190 + ((frame / DURATION) % 1) * 340;

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(120% 120% at 68% 50%, ${COLORS.emerald} 0%, ${COLORS.emeraldDeep} 58%, #01120d 100%)`,
        fontFamily: "ui-monospace, Menlo, monospace",
        overflow: "hidden",
      }}
    >
      {/* Terminal panel */}
      <div
        style={{
          position: "absolute",
          left: 70,
          top: 170,
          width: 500,
          height: 380,
          borderRadius: 12,
          background: "rgba(2, 20, 15, 0.72)",
          border: `1px solid ${COLORS.emerald}`,
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          padding: "26px 28px",
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {["#f87171", "#fbbf24", "#34d399"].map((c) => (
            <div key={c} style={{ width: 12, height: 12, borderRadius: "50%", background: c }} />
          ))}
        </div>
        {LINES.map((ln, i) => {
          const lineY = 216 + i * 46;
          const heat = Math.max(0, 1 - Math.abs(lineY - bandY) / 40);
          return (
            <div
              key={i}
              style={{
                fontSize: 22,
                lineHeight: "46px",
                color: heat > 0.1 ? COLORS.gold : COLORS.emeraldGlow,
                textShadow: heat > 0.1 ? `0 0 12px ${COLORS.ember}` : "none",
                opacity: 0.6 + heat * 0.4,
              }}
            >
              {ln}
            </div>
          );
        })}
      </div>

      {/* Ember stream: terminal -> artifact */}
      {[...Array(N)].map((_, i) => {
        const p = ((frame / DURATION + rand(i)) % 1);
        const sx = 150 + rand(i + 1) * 380;
        const sy = 230 + rand(i + 2) * 300;
        const x = sx + (TARGET.x - sx) * p;
        const bow = -120 * Math.sin(Math.PI * p) * (0.6 + rand(i + 4));
        const y = sy + (TARGET.y - sy) * p + bow;
        const op = Math.sin(Math.PI * p);
        const size = 6 - p * 3.5;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: size,
              height: size,
              borderRadius: "50%",
              background: p < 0.6 ? COLORS.emberHot : COLORS.emeraldGlow,
              boxShadow: `0 0 8px ${p < 0.6 ? COLORS.gold : COLORS.emeraldGlow}`,
              opacity: op * 0.9,
            }}
          />
        );
      })}

      {/* Reformed structured emerald artifact */}
      <div
        style={{
          position: "absolute",
          left: TARGET.x,
          top: TARGET.y,
          transform: "translate(-50%, -50%)",
          width: 180,
          height: 210,
          borderRadius: 14,
          background: `linear-gradient(160deg, ${COLORS.emeraldBright}, ${COLORS.emerald} 55%, ${COLORS.emeraldDeep})`,
          border: `1.5px solid ${COLORS.emeraldGlow}`,
          boxShadow: `0 0 ${40 + 14 * Math.sin((frame / DURATION) * Math.PI * 2)}px 4px ${COLORS.emeraldGlow}`,
          padding: 20,
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          justifyContent: "center",
        }}
      >
        <div style={{ fontSize: 30, color: COLORS.white, textAlign: "center" }}>◆</div>
        {[0.9, 0.65, 0.8, 0.5].map((w, i) => (
          <div
            key={i}
            style={{
              height: 12,
              width: `${w * 100}%`,
              borderRadius: 4,
              background: "rgba(255,255,255,0.55)",
            }}
          />
        ))}
      </div>

      <Watermark text={WATERMARK} />
    </AbsoluteFill>
  );
};
