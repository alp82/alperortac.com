import type { InnerRenderProps } from "../types";
import { DENSITY_HEADING, DENSITY_MAXW } from "./shared";

/*
 * Inner: token-stream - "the heading as it leaves the model."
 *
 * A tokenizer view of the topic: the heading split into word-tokens, each on
 * its own translucent chip with the palette's hues cycling across chips
 * (tokenizer-visualizer style), a mono eyebrow, and the topic's REAL body
 * seated plain below. Signature toggle (params.caret) = a streaming block
 * caret after the last token, still being generated (blink in CSS, stilled
 * under reduced motion); theming knob (palette) = the chip hue cycle
 * (candy / jade / mono), applied inline per chip - no background paints
 * behind the cluster, it floats over the landscape.
 */

/** palette → the 4-hue chip cycle (translucent underlays under white text). */
const PALETTES: Record<
	InnerRenderProps<"token-stream">["params"]["palette"],
	[string, string, string, string]
> = {
	candy: [
		"rgba(244, 114, 182, 0.28)",
		"rgba(125, 211, 252, 0.28)",
		"rgba(253, 224, 71, 0.24)",
		"rgba(52, 211, 153, 0.26)",
	],
	jade: [
		"rgba(52, 211, 153, 0.30)",
		"rgba(45, 212, 191, 0.26)",
		"rgba(56, 189, 248, 0.24)",
		"rgba(163, 230, 53, 0.22)",
	],
	mono: [
		"rgba(255, 255, 255, 0.22)",
		"rgba(255, 255, 255, 0.12)",
		"rgba(255, 255, 255, 0.18)",
		"rgba(255, 255, 255, 0.08)",
	],
};

export function TokenStreamCluster({
	topic,
	index,
	params,
	children,
}: InnerRenderProps<"token-stream">) {
	const hues = PALETTES[params.palette];
	// Precomputed chip list: repeated words are distinct tokens, so each chip
	// carries a positional key + its hue (kept out of the JSX map for lint).
	const chips = topic.heading
		.split(/\s+/)
		.filter(Boolean)
		.map((word, i) => ({
			word,
			key: `t${i}-${word}`,
			hue: hues[i % hues.length],
		}));

	return (
		<div className={`relative w-full ${DENSITY_MAXW[params.density]}`}>
			<div className="flex flex-col items-center text-center gap-5">
				<div className="tok-eyebrow font-mono text-[11px] uppercase tracking-[0.35em]">
					▮ token stream {String(index + 1).padStart(2, "0")}
				</div>

				{/* the heading, tokenized - one chip per word, hues cycling */}
				<h2
					className={`${DENSITY_HEADING[params.density]} font-black uppercase tracking-tighter text-white leading-none`}
				>
					<span className="inline-flex flex-wrap items-baseline justify-center gap-x-3 gap-y-2 md:gap-x-4">
						{chips.map((chip) => (
							<span
								key={chip.key}
								className="tok-chip"
								style={{ backgroundColor: chip.hue }}
							>
								{chip.word}
							</span>
						))}
						{params.caret && <span className="tok-caret" aria-hidden="true" />}
					</span>
				</h2>

				<div className="w-full text-left">{children}</div>
			</div>
		</div>
	);
}
