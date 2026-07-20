import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { COLORS, DURATION, WATERMARK } from "./theme";
import { Watermark } from "./Watermark";

// Concept 1 — Molten forge.
// Ember bed pulses, a metal bar heats amber->white, a hammer strikes and throws
// sparks, then everything cools back to the start for a seamless loop.

const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1) * 43758.5453;
  return x - Math.floor(x);
};

const STRIKE = 52; // frame the hammer connects

export const MoltenForge: React.FC = () => {
  const frame = useCurrentFrame();

  // Heat: cool at both ends (seamless), white-hot just after the strike.
  const heat = interpolate(frame, [0, 40, 56, 100, DURATION], [0, 0.25, 1, 0.1, 0], {
    extrapolateRight: "clamp",
  });
  const barColor = interpolate(heat, [0, 0.4, 0.75, 1], [0, 1, 2, 3], {
    extrapolateRight: "clamp",
  });
  const barFill = [COLORS.emerald, COLORS.ember, COLORS.gold, COLORS.white][
    Math.round(barColor)
  ];

  // Hammer swing: down onto the bar at STRIKE, back up by loop end (starts == ends).
  const hammerAngle = interpolate(
    frame,
    [0, STRIKE, 84, DURATION],
    [-52, 8, -52, -52],
    { extrapolateRight: "clamp" }
  );

  // Ember bed flicker — integer sine cycles keep it seamless.
  const flicker =
    0.55 +
    0.25 * Math.sin((frame / DURATION) * Math.PI * 2 * 3) +
    0.12 * Math.sin((frame / DURATION) * Math.PI * 2 * 7);

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(120% 90% at 50% 78%, ${COLORS.emerald} 0%, ${COLORS.emeraldDeep} 55%, #01120d 100%)`,
        fontFamily: "Inter, system-ui, sans-serif",
        overflow: "hidden",
      }}
    >
      {/* Ember bed */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 180,
          background: `linear-gradient(to top, ${COLORS.ember}, transparent)`,
          opacity: 0.25 + heat * 0.3,
          filter: "blur(6px)",
        }}
      />
      {[...Array(26)].map((_, i) => {
        const x = (i / 25) * 100;
        const glow = flicker * (0.6 + rand(i) * 0.7);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${x}%`,
              bottom: 24 + rand(i + 9) * 40,
              width: 26,
              height: 26,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${COLORS.white} 0%, ${COLORS.ember} 45%, transparent 70%)`,
              opacity: Math.min(1, glow),
              filter: "blur(2px)",
            }}
          />
        );
      })}

      {/* The bar on the anvil */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: 460,
          height: 40,
          borderRadius: 6,
          background: barFill,
          boxShadow: `0 0 ${20 + heat * 90}px ${heat * 28}px ${COLORS.emberHot}`,
        }}
      />
      {/* Anvil */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "calc(50% + 46px)",
          transform: "translateX(-50%)",
          width: 260,
          height: 70,
          borderRadius: "6px 6px 10px 10px",
          background: "linear-gradient(#0b3b30, #052018)",
        }}
      />

      {/* Hammer */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: `translate(-50%, -140px) rotate(${hammerAngle}deg)`,
          transformOrigin: "50% 140px",
        }}
      >
        <div style={{ width: 10, height: 150, background: "#3f2d1a", margin: "0 auto" }} />
        <div
          style={{
            width: 90,
            height: 44,
            background: "linear-gradient(#94a3b8, #475569)",
            borderRadius: 6,
            marginTop: -6,
          }}
        />
      </div>

      {/* Sparks on strike */}
      {[...Array(34)].map((_, i) => {
        const age = frame - STRIKE - rand(i) * 4;
        if (age < 0 || age > 34) return null;
        const dir = (rand(i + 3) - 0.5) * 2;
        const vx = dir * (5 + rand(i + 1) * 9);
        const vy = -(9 + rand(i + 2) * 9);
        const x = 640 + vx * age;
        const y = 340 + vy * age + 0.32 * age * age;
        const life = 1 - age / 34;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: 4,
              height: 4,
              borderRadius: "50%",
              background: COLORS.white,
              boxShadow: `0 0 8px ${COLORS.gold}`,
              opacity: life,
            }}
          />
        );
      })}

      <Watermark text={WATERMARK} />
    </AbsoluteFill>
  );
};
