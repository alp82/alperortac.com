import type { InnerRenderProps } from "../types";
import { DENSITY_MAXW } from "./shared";

/*
 * Inner: keycaps - "mechanical-keycap heading."
 *
 * Tactile hardware, delicate chrome: the heading spelled character-by-character
 * as rounded mechanical keycap tiles (word gaps become a small spacer, never an
 * empty cap), a slim spacebar-shaped rule closing the header below the row, and
 * the topic's REAL body (the shared plate) sitting clear underneath with
 * nothing printed over it. Signature toggle (params.backlight) = a soft static
 * accent under-glow per cap, set INLINE on each tile from --kc-glow (the bevel
 * lives on its own .keycap-bevel layer in CSS, since an inline box-shadow on
 * the tile would override a CSS bevel on the same element); theming knob
 * (colorway) = cap + legend ink (beige / graphite / milkshake), handed to the
 * `.keycap-*` classes as --kc-cap / --kc-ink inline vars (the timecard --tc-*
 * convention). The glow tracks the accent prop only - never the colorway.
 */

/* colorway → { cap, ink } - cap top surface + legend ink. */
const COLORWAY: Record<
	InnerRenderProps<"keycaps">["params"]["colorway"],
	{ cap: string; ink: string }
> = {
	beige: { cap: "#e9e2d2", ink: "#443f35" },
	graphite: { cap: "#3b3e44", ink: "#e7e9ec" },
	milkshake: { cap: "#f4e9ef", ink: "#584653" },
};

/* density → cap size (the tile's own scale, beside the shared max-width). */
const CAP_SIZE: Record<
	InnerRenderProps<"keycaps">["params"]["density"],
	string
> = {
	cozy: "h-9 min-w-9 px-1.5 text-lg",
	comfortable: "h-11 min-w-11 px-2 text-xl",
	roomy: "h-13 min-w-13 px-2.5 text-2xl md:h-15 md:min-w-15 md:text-3xl",
};

export function KeycapsCluster({
	topic,
	params,
	accent,
	children,
}: InnerRenderProps<"keycaps">) {
	const c = COLORWAY[params.colorway];

	// keycaps = one entry per heading char; keys count repeats per glyph so
	// they stay stable without leaning on the array index.
	const seen = new Map<string, number>();
	const caps = [...topic.heading].map((ch) => {
		const n = (seen.get(ch) ?? 0) + 1;
		seen.set(ch, n);
		return { ch, key: `${ch === " " ? "space" : ch}-${n}` };
	});

	return (
		<div
			className={`w-full ${DENSITY_MAXW[params.density]} flex flex-col items-center`}
		>
			{/* the caps row IS the heading visually, but it is aria-hidden
			    per-character decoration - this announces the real heading. */}
			<h2 className="sr-only">{topic.heading}</h2>

			<div
				className="flex flex-col items-center"
				style={
					{
						"--kc-cap": c.cap,
						"--kc-ink": c.ink,
						...(params.backlight
							? {
									"--kc-glow": `color-mix(in srgb, ${accent} 75%, transparent)`,
								}
							: {}),
					} as React.CSSProperties
				}
				aria-hidden="true"
			>
				<div className="keycap-row flex flex-wrap items-center justify-center gap-1.5 md:gap-2">
					{caps.map(({ ch, key }) =>
						ch === " " ? (
							<span key={key} className="keycap-spacer" />
						) : (
							<span
								key={key}
								className={`keycap-tile ${CAP_SIZE[params.density]} relative inline-flex items-center justify-center font-mono font-bold`}
								style={
									params.backlight
										? { boxShadow: "0 10px 22px -6px var(--kc-glow)" }
										: undefined
								}
							>
								<span className="keycap-bevel" aria-hidden="true" />
								<span className="keycap-legend">{ch}</span>
							</span>
						),
					)}
				</div>

				{/* spacebar-shaped rule closing the header - always on */}
				<span className="keycap-rule mt-3" />
			</div>

			{/* the body sits clear on the standard plate - nothing prints over it */}
			<div className="w-full mt-6">{children}</div>
		</div>
	);
}
