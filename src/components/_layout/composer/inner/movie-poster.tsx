import type { InnerRenderProps } from "../types";
import { DENSITY_MAXW } from "./shared";

/*
 * Inner: movie-poster - "one-sheet."
 *
 * A theatrical one-sheet poster is the frame: a bordered card whose key-art
 * backdrop is a gradient sky/ground wash, a letterspaced COMING SOON strip
 * on top, the heading as the big condensed uppercase title treatment (the
 * frame's centerpiece), a small generic cert badge, the topic's REAL body
 * seated in the poster's midfield over a near-solid scrim (art fades behind
 * the text block - readability first), and a compressed-caps billing block
 * at the foot. All credits text is fixed decorative theater naming no real
 * people, aria-hidden. Signature toggle (params.billing) = the billing
 * block; theming knob (art) = the key-art palette (dusk / neon / noir),
 * handed to the `.poster-*` classes as --poster-sky / --poster-ground /
 * --poster-ink / --poster-accent inline vars (the rack --rack-* convention).
 */

/** art → { sky, ground, ink, accent } - key-art gradient ends, ink, trim. */
const ARTS: Record<
	InnerRenderProps<"movie-poster">["params"]["art"],
	{ sky: string; ground: string; ink: string; accent: string }
> = {
	dusk: {
		sky: "#312446",
		ground: "#0d0a14",
		ink: "#f3e8ff",
		accent: "#f0abfc",
	},
	neon: {
		sky: "#0f2b3d",
		ground: "#090d16",
		ink: "#e0f2fe",
		accent: "#22d3ee",
	},
	noir: {
		sky: "#2b2b31",
		ground: "#0a0a0c",
		ink: "#e5e7eb",
		accent: "#d4d4d8",
	},
};

/** Fixed billing lines - classic compressed-caps theater, no real people. */
const BILLING = [
	"A RIVERBEND PICTURES PRESENTATION  A FILM BY THE COMPOSER",
	"CASTING BY THE PANEL  MUSIC BY THE LANDSCAPE  EDITED IN CAMERA",
	"WRITTEN AND DIRECTED BY THE WALK",
];

export function MoviePosterCluster({
	topic,
	params,
	children,
}: InnerRenderProps<"movie-poster">) {
	const a = ARTS[params.art];

	return (
		<div className={`w-full ${DENSITY_MAXW[params.density]}`}>
			<div
				className="poster relative text-center"
				style={
					{
						"--poster-sky": a.sky,
						"--poster-ground": a.ground,
						"--poster-ink": a.ink,
						"--poster-accent": a.accent,
					} as React.CSSProperties
				}
			>
				{/* top strip - release theater */}
				<div
					className="poster-strip relative pt-5 text-[10px] font-semibold uppercase tracking-[0.5em]"
					aria-hidden="true"
				>
					Coming Soon
				</div>

				{/* the big title treatment - the poster's centerpiece */}
				<h2 className="poster-title relative px-6 md:px-9 pt-4 font-bold uppercase text-4xl md:text-6xl leading-none">
					{topic.heading}
				</h2>

				{/* cert badge - generic, decorative */}
				<div className="relative mt-4 flex justify-center" aria-hidden="true">
					<span className="poster-cert inline-block px-2 py-0.5 text-[10px] font-bold tracking-[0.2em]">
						PG
					</span>
				</div>

				{/* the topic's REAL body - the poster's midfield, over a scrim */}
				<div className="poster-body relative mx-4 md:mx-7 my-6 px-4 md:px-6 py-5 text-left">
					{children}
				</div>

				{/* billing block - compressed-caps credits theater */}
				{params.billing && (
					<div
						className="poster-billing relative px-6 md:px-9 pb-6"
						aria-hidden="true"
					>
						<span className="poster-rule block mx-auto mb-3" />
						{BILLING.map((line) => (
							<p
								key={line}
								className="poster-credits text-[8px] md:text-[9px] font-semibold uppercase leading-relaxed"
							>
								{line}
							</p>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
