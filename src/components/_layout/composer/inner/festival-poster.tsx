import { CoverWallBackdrop, ShelfStripTrigger } from "../../music/CoverWall";
import type { InnerRenderProps } from "../types";
import { DENSITY_MAXW } from "./shared";

/*
 * Inner: festival-poster - "one stage, one listener."
 *
 * A festival lineup poster is the frame: an "ALP" presents-eyebrow, the
 * heading huge and centered as the festival name, an optional tiered lineup
 * bill, a date strip, and the topic's REAL body seated below as the fine
 * print. The bill is HONEST chrome - the tiers mirror the artists on the
 * Music subpage's album shelf (src/data/personal.ts), hand-editable here
 * alongside it (the ticket-stub route-strip precedent). All chrome is
 * deterministic theater, all aria-hidden.
 * Signature toggle (params.lineup) = the bill; theming knob (poster) sets the
 * poster wash via the `.fsp-*` inline vars (--fsp-a / --fsp-b / --fsp-ink -
 * the sbb --sbb-* convention).
 */

/** poster → { a, b, ink } - wash top, wash bottom, headline accent ink. */
const POSTERS: Record<
	InnerRenderProps<"festival-poster">["params"]["poster"],
	{ a: string; b: string; ink: string }
> = {
	dusk: { a: "#312e81", b: "#831843", ink: "#fbbf24" },
	midnight: { a: "#0f172a", b: "#1e1b4b", ink: "#a5b4fc" },
	acid: { a: "#14532d", b: "#111827", ink: "#a3e635" },
};

/*
 * The bill - tiers mirror the album shelf's artists (personal.ts), largest
 * type for the heaviest rotation. Hand-edit here when the shelf changes.
 */
const HEADLINERS = ["GOJIRA", "MUSE", "NINE INCH NAILS"];
const SECOND_STAGE = ["SYSTEM OF A DOWN", "PORCUPINE TREE", "ENTER SHIKARI"];
const UNDERCARD = [
	"Haken",
	"Periphery",
	"Noisia",
	"Rezz",
	"Soilwork",
	"Waltari",
];

export function FestivalPosterCluster({
	topic,
	params,
	lastTriggerRef,
	children,
}: InnerRenderProps<"festival-poster">) {
	const p = POSTERS[params.poster];

	// music only (#26, topic.id gate - no param, the streaming-billboard
	// movies-tv precedent): the album shelf's covers back the whole poster as
	// an ambient dimmed flicker wall, and the date strip rewords into the one
	// trigger into the /music subpage. Other topics picking this frame keep
	// the plain date strip and get no wall.
	const isMusic = topic.id === "music";

	return (
		<div className={`w-full ${DENSITY_MAXW[params.density]}`}>
			<div
				className="fsp relative text-center"
				style={
					{
						"--fsp-a": p.a,
						"--fsp-b": p.b,
						"--fsp-ink": p.ink,
					} as React.CSSProperties
				}
			>
				{isMusic && <CoverWallBackdrop />}
				{/* presents eyebrow */}
				<p
					className="fsp-eyebrow relative pt-6 text-[10px] font-extrabold tracking-[0.32em]"
					aria-hidden="true"
				>
					ALP PRESENTS
				</p>

				{/* the festival name */}
				<h2 className="fsp-title relative mt-3 px-6 font-black uppercase text-5xl md:text-7xl leading-none tracking-tight">
					{topic.heading}
				</h2>

				{/* the bill - honest tiers off the album shelf */}
				{params.lineup && (
					<div className="fsp-bill relative mt-6 px-6" aria-hidden="true">
						<p className="fsp-tier1 text-lg md:text-2xl font-extrabold tracking-[0.06em]">
							{HEADLINERS.join(" · ")}
						</p>
						<p className="fsp-tier2 mt-2 text-sm md:text-base font-bold tracking-[0.05em]">
							{SECOND_STAGE.join(" · ")}
						</p>
						<p className="fsp-tier3 mt-2 text-[11px] md:text-xs font-semibold tracking-[0.04em]">
							{UNDERCARD.join(" · ")}
						</p>
					</div>
				)}

				{/* date strip - on music it IS the /music trigger */}
				{isMusic ? (
					<ShelfStripTrigger lastTriggerRef={lastTriggerRef} />
				) : (
					<p
						className="fsp-dates relative mt-6 mx-6 py-2 text-[10px] font-extrabold tracking-[0.28em]"
						aria-hidden="true"
					>
						EVERY DAY · ONE STAGE · ONE LISTENER
					</p>
				)}

				{/* the topic's REAL body - the fine print */}
				<div className="relative px-6 md:px-9 py-6 text-left">{children}</div>
			</div>
		</div>
	);
}
