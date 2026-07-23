import { useId } from "react";
import type { InnerRenderProps } from "../types";
import { DENSITY_MAXW } from "./shared";

/*
 * Inner: polaroid
 *
 * A scrapbook page with a Kodak-era print taped into it: a kraft/paper board
 * carries the themed heading as a handwritten caption and the topic's REAL
 * body as the page body; the print floats INSIDE the prose flow (top-right,
 * text wraps around it - it never covers the words). The print itself is a
 * glossy white-bordered portrait photo with a quartz-orange date stamp and a
 * handwritten caption on the border - the photo window holds an
 * anonymity-friendly sunset silhouette of the family (two grown-ups, three
 * kids) until real photos land. Signature toggle = the washi tape; `tilt`
 * rotates the print inline.
 */

/* Kraft scrapbook board - paper grain + soft fibre speckle. The kraft base
 * carries the site-wide band-shell translucency (#40) so the landscape reads
 * through; the fibre speckle rides on top. */
const BOARD_STYLE: React.CSSProperties = {
	backgroundColor:
		"color-mix(in srgb, #e7dcc4 var(--band-shell-alpha), transparent)",
	backgroundImage:
		"radial-gradient(circle at 20% 12%, rgba(120,90,40,0.07) 1px, transparent 1px), radial-gradient(circle at 78% 64%, rgba(120,90,40,0.06) 1px, transparent 1px)",
	backgroundSize: "20px 20px, 28px 28px",
	backdropFilter: "blur(var(--band-shell-blur))",
	WebkitBackdropFilter: "blur(var(--band-shell-blur))",
	border: "1px solid #c9b791",
	boxShadow: "2px 6px 18px -8px rgba(80,60,30,0.45)",
};

/** tilt → rotation (deg) of the taped-in print (applied inline). */
const TILT_DEG: Record<InnerRenderProps<"polaroid">["params"]["tilt"], number> =
	{
		left: -3,
		straight: 0,
		right: 3,
	};

/**
 * Placeholder photo: golden-hour silhouettes of the five of them - readable
 * as a family shot, anonymous by construction. Swapped for real print scans
 * when the media treatment lands.
 */
function SilhouettePhoto() {
	const skyId = useId();
	return (
		<svg
			viewBox="0 0 150 200"
			className="block w-full h-full"
			aria-hidden="true"
			preserveAspectRatio="xMidYMid slice"
		>
			<defs>
				<linearGradient id={skyId} x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor="#ffe3a8" />
					<stop offset="55%" stopColor="#ffab6b" />
					<stop offset="100%" stopColor="#e06d4e" />
				</linearGradient>
			</defs>
			{/* sky + low sun */}
			<rect width="150" height="200" fill={`url(#${skyId})`} />
			<circle cx="75" cy="128" r="26" fill="#fff2c4" opacity="0.9" />
			{/* ground */}
			<rect y="150" width="150" height="50" fill="#3a2420" />
			{/* the five of them, holding the line at dusk: head + body per figure */}
			{(
				[
					[26, 150, 8.5, 34], // grown-up
					[52, 150, 5.5, 22], // kid
					[75, 150, 6.5, 26], // kid
					[97, 150, 5, 19], // kid
					[124, 150, 8.5, 36], // grown-up
				] as const
			).map(([cx, base, head, h]) => (
				<g key={cx} fill="#2b1a16">
					<circle cx={cx} cy={base - h} r={head} />
					<rect
						x={cx - head * 0.9}
						y={base - h + head * 0.6}
						width={head * 1.8}
						height={h - head * 0.6}
						rx={head * 0.7}
					/>
				</g>
			))}
		</svg>
	);
}

export function PolaroidCluster({
	topic,
	params,
	children,
}: InnerRenderProps<"polaroid">) {
	const tilt = TILT_DEG[params.tilt];

	return (
		<div className={`w-full ${DENSITY_MAXW[params.density]}`}>
			<div className="relative px-7 md:px-10 py-9 md:py-10" style={BOARD_STYLE}>
				<h2 className="scrapbook-hand font-black tracking-tight text-3xl md:text-5xl text-slate-900 leading-none">
					{topic.heading}
				</h2>

				<div className="mt-6">
					{/* the print floats in the prose flow - text wraps, never hides */}
					<figure
						className="kodak-print relative float-right w-36 md:w-48 ml-5 md:ml-7 mb-3 mt-1"
						style={{ transform: `rotate(${tilt}deg)` }}
					>
						{params.tape && (
							<span className="polaroid-tape" aria-hidden="true" />
						)}
						<div className="kodak-photo relative overflow-hidden">
							<SilhouettePhoto />
							<span className="kodak-datestamp" aria-hidden="true">
								&rsquo;25&nbsp;07&nbsp;05
							</span>
						</div>
						<figcaption className="flex items-baseline justify-between gap-2 px-1 pt-1.5 pb-1">
							<span className="scrapbook-hand text-slate-600 text-sm leading-none">
								the five of us
							</span>
							<span className="kodak-mark">KODAK&middot;GOLD</span>
						</figcaption>
					</figure>

					{children}
				</div>
			</div>
		</div>
	);
}
