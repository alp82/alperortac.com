import { COLORS } from "./theme";

// Small FORGE · PIPELINE identity mark, shared across the concepts.
export const Watermark: React.FC<{ text: string; light?: boolean }> = ({
  text,
  light,
}) => (
  <div
    style={{
      position: "absolute",
      bottom: 20,
      right: 26,
      fontSize: 18,
      letterSpacing: 4,
      fontWeight: 700,
      color: light ? COLORS.ink : COLORS.emeraldGlow,
      opacity: 0.72,
      fontFamily: "ui-monospace, Menlo, monospace",
    }}
  >
    {text}
  </div>
);
