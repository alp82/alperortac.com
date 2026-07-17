import type { InnerRenderProps } from "../types";
import { DENSITY_MAXW } from "./shared";

/*
 * Inner: letterbox - "the 21:9 frame."
 *
 * A cinematic letterbox is the frame, and the most minimal of the five
 * movies-tv candidates: solid near-black bars top and bottom (fixed
 * constants - they ARE the letterbox, not a theme axis), a color-graded
 * stage between them with a static film-grain wash (inline feTurbulence SVG
 * data-URI on the stage's background layer - always BEHIND the text, never
 * over it, no animation), the heading small and letterspaced at the stage
 * top, the topic's REAL body in the stage, and a classic subtitle caption
 * line at the stage foot. The bars/stage are content-height chrome - the
 * stage grows with the prose, never a locked 21:9 aspect ratio + overflow
 * crop; the widescreen look is an illusion, not a constraint. Signature
 * toggle (params.subtitles) = the caption line; theming knob (grade) = the
 * color grade (silver / amber / teal), handed to the `.lbx-*` classes as
 * --lbx-wash / --lbx-ink inline vars (the rack --rack-* convention).
 */

/** grade → { wash, ink } - stage tint, tuned stage ink. */
const GRADES: Record<
	InnerRenderProps<"letterbox">["params"]["grade"],
	{ wash: string; ink: string }
> = {
	silver: { wash: "#1b1e24", ink: "#e5e7eb" },
	amber: { wash: "#221a10", ink: "#f5e9d5" },
	teal: { wash: "#10201f", ink: "#d9efec" },
};

/** Fixed subtitle line - decorative caption theater, aria-hidden. */
const SUBTITLE = "[quiet piano] Some stories only work on the big screen.";

export function LetterboxCluster({
	topic,
	params,
	children,
}: InnerRenderProps<"letterbox">) {
	const g = GRADES[params.grade];

	return (
		<div className={`w-full ${DENSITY_MAXW[params.density]}`}>
			<div
				className="lbx relative text-left"
				style={
					{
						"--lbx-wash": g.wash,
						"--lbx-ink": g.ink,
					} as React.CSSProperties
				}
			>
				{/* top letterbox bar - fixed near-black, chrome not crop */}
				<div className="lbx-bar" aria-hidden="true" />

				{/* the graded stage - grain lives on the background layer only */}
				<div className="lbx-stage relative px-6 md:px-10 py-7">
					<h2 className="lbx-title font-semibold uppercase text-lg md:text-2xl tracking-[0.35em] leading-snug">
						{topic.heading}
					</h2>

					{/* the topic's REAL body - seated on the stage */}
					<div className="relative py-6">{children}</div>

					{/* subtitle caption at the stage foot */}
					{params.subtitles && (
						<p
							className="lbx-subtitle text-center text-sm md:text-base"
							aria-hidden="true"
						>
							{SUBTITLE}
						</p>
					)}
				</div>

				{/* bottom letterbox bar */}
				<div className="lbx-bar" aria-hidden="true" />
			</div>
		</div>
	);
}
