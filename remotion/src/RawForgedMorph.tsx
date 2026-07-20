import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { COLORS, DURATION, WATERMARK } from "./theme";
import { Watermark } from "./Watermark";

// Concept 3 — Raw -> forged morph.
// A rough ember block is struck, morphs into a crisp faceted emerald artifact,
// holds, then dissolves back to raw for a seamless loop.

const rand = (s: number) => {
  const x = Math.sin(s * 91.7) * 43758.5453;
  return x - Math.floor(x);
};

const STRIKE = 40;

export const RawForgedMorph: React.FC = () => {
  const frame = useCurrentFrame();

  const rawOpacity = interpolate(frame, [0, 22, 45, 100, DURATION], [1, 1, 0, 0, 1], {
    extrapolateRight: "clamp",
  });
  const forgedOpacity = interpolate(
    frame,
    [0, 40, 66, 100, DURATION],
    [0, 0, 1, 1, 0],
    { extrapolateRight: "clamp" }
  );
  const wobble = Math.sin((frame / DURATION) * Math.PI * 2 * 4) * 4 * rawOpacity;
  const spin = interpolate(frame, [40, 100], [0, 40], { extrapolateRight: "clamp" });
  const heatGlow = interpolate(frame, [30, STRIKE, 70], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(120% 120% at 50% 52%, ${COLORS.emerald} 0%, ${COLORS.emeraldDeep} 58%, #01120d 100%)`,
        fontFamily: "Inter, system-ui, sans-serif",
        overflow: "hidden",
      }}
    >
      {/* Forge heat wash behind the object during the strike */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 520,
          height: 520,
          transform: "translate(-50%, -50%)",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.ember} 0%, transparent 62%)`,
          opacity: heatGlow * 0.55,
          filter: "blur(20px)",
        }}
      />

      {/* Raw ember block */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 240,
          height: 180,
          transform: `translate(-50%, -50%) rotate(${wobble}deg)`,
          borderRadius: "38% 42% 40% 36% / 44% 38% 42% 40%",
          background: `radial-gradient(circle at 40% 35%, ${COLORS.white} 0%, ${COLORS.gold} 22%, ${COLORS.ember} 55%, #7c2d12 100%)`,
          boxShadow: `0 0 90px 20px ${COLORS.emberHot}`,
          opacity: rawOpacity,
        }}
      />

      {/* Forged emerald artifact (faceted gem/tool) */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 210,
          height: 210,
          transform: `translate(-50%, -50%) rotate(${45 + spin}deg)`,
          opacity: forgedOpacity,
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            background: `conic-gradient(from 45deg, ${COLORS.emeraldGlow}, ${COLORS.emerald}, ${COLORS.emeraldDeep}, ${COLORS.emeraldBright}, ${COLORS.emeraldGlow})`,
            borderRadius: 10,
            boxShadow: `0 0 60px 6px ${COLORS.emeraldGlow}, inset 0 0 40px rgba(255,255,255,0.35)`,
            border: `2px solid ${COLORS.emeraldGlow}`,
          }}
        />
        {/* facet lines */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(45deg, transparent 48%, rgba(255,255,255,0.5) 50%, transparent 52%), linear-gradient(-45deg, transparent 48%, rgba(255,255,255,0.35) 50%, transparent 52%)",
          }}
        />
      </div>

      {/* Sparks on strike */}
      {[...Array(30)].map((_, i) => {
        const age = frame - STRIKE - rand(i) * 5;
        if (age < 0 || age > 30) return null;
        const ang = rand(i + 2) * Math.PI * 2;
        const sp = 6 + rand(i + 5) * 12;
        const x = 640 + Math.cos(ang) * sp * age;
        const y = 360 + Math.sin(ang) * sp * age + 0.2 * age * age;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: COLORS.white,
              boxShadow: `0 0 8px ${COLORS.gold}`,
              opacity: 1 - age / 30,
            }}
          />
        );
      })}

      <Watermark text={WATERMARK} />
    </AbsoluteFill>
  );
};
