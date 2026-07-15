import type { InnerRenderProps } from "../types";
import { DENSITY_MAXW } from "./shared";

/*
 * Inner: offer-letter - "cream letterhead."
 *
 * A formal letter: an embossed monogram + a dated letterhead band up top, the
 * heading as the letter's subject line, the topic's REAL body (the shared light
 * plate) as the letter body - unobstructed, no creases across the prose - and a
 * signed-off foot below it. Signature toggle (params.scrawl) = the SINCERELY
 * eyebrow + the handwritten sign-off; theming knob (stock) = the letter's paper
 * + ink (cream / ivory / dove), handed to the `.letter-*` classes as
 * --ol-paper / --ol-ink so the chrome can never desync from the stock.
 */

/* stock → { paper, ink } - letter stock + printed ink. */
const STOCK: Record<
	InnerRenderProps<"offer-letter">["params"]["stock"],
	{ paper: string; ink: string }
> = {
	cream: { paper: "#fbf4e4", ink: "#3b3320" },
	ivory: { paper: "#fdfaf2", ink: "#33302a" },
	dove: { paper: "#eef0f2", ink: "#2b3440" },
};

/** Date line months - the date is derived from `index`, never wall-clock time,
 * so the letterhead renders identically on the server and the client. */
const MONTHS = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
];

export function OfferLetterCluster({
	topic,
	index,
	params,
	children,
}: InnerRenderProps<"offer-letter">) {
	const s = STOCK[params.stock];
	const monogram = topic.heading.charAt(0).toUpperCase();
	const day = String(index + 1).padStart(2, "0");
	const dateLine = `${day} ${MONTHS[index % MONTHS.length]} ${2014 + index}`;

	return (
		<div className={`w-full ${DENSITY_MAXW[params.density]}`}>
			<div
				className="letter-sheet px-8 md:px-12 py-8 md:py-10 text-left"
				style={
					{
						"--ol-paper": s.paper,
						"--ol-ink": s.ink,
						backgroundColor: s.paper,
						color: s.ink,
					} as React.CSSProperties
				}
			>
				{/* letterhead band - monogram, eyebrow, dated line.
				    flex-wrap + min-w-0 (same guard timecard's header column uses): at
				    ~360px the monogram + tracked eyebrow (~230px) plus the date
				    (~100px) overflow the px-8 card, and .letter-sheet has no
				    overflow:hidden, so the eyebrow would spill past the sheet edge. */}
				<div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
					<div className="flex min-w-0 items-center gap-4">
						<span className="letter-monogram" aria-hidden="true">
							{monogram}
						</span>
						{/* opacity-75, not -60: announced text; 0.6 --ol-ink on --ol-paper
						    computes to 3.5-3.7:1, under WCAG 1.4.3's 4.5:1. 0.75 clears
						    all three stocks (5.3-5.8:1). */}
						<span className="min-w-0 font-mono text-[10px] uppercase tracking-[0.3em] opacity-75">
							Offer of employment
						</span>
					</div>
					<span className="font-mono text-[11px] tracking-wide opacity-70">
						{dateLine}
					</span>
				</div>
				<span className="letter-crease" aria-hidden="true" />

				{/* subject line + the letter body */}
				<h2 className="font-serif text-3xl md:text-4xl leading-tight mt-6">
					{topic.heading}
				</h2>
				<div className="mt-5">{children}</div>

				{/* signed foot */}
				{params.scrawl && (
					<div className="mt-8">
						<span className="letter-crease" aria-hidden="true" />
						{/* opacity-75 for the same 4.5:1 reason as the letterhead eyebrow
						    - "SINCERELY" is announced text at the identical ink/paper. */}
						<div className="font-mono text-[10px] uppercase tracking-[0.3em] opacity-75 mt-5">
							SINCERELY
						</div>
						<div className="letter-scrawl text-3xl md:text-4xl mt-1">Alper</div>
					</div>
				)}
			</div>
		</div>
	);
}
