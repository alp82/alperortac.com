import type { InnerRenderProps } from "../types";
import { flourishSrc } from "../types";
import { DENSITY_MAXW } from "./shared";

/*
 * Inner: polaroid
 *
 * A scrapbook page with a polaroid pinned in the corner: a wide kraft/paper
 * board (widened to hold the plate) carries a rotated polaroid accent in the
 * top corner (washi-tape toggle + flourish photo), the themed heading as a
 * handwritten caption, and the topic's REAL body (the shared light plate) as
 * the page body. Playful collage. Signature toggle = the washi tape on the
 * polaroid; `tilt` rotates the pinned polaroid inline.
 */

/* Kraft scrapbook board - paper grain + soft fibre speckle. */
const BOARD_STYLE: React.CSSProperties = {
	backgroundColor: "#e7dcc4",
	backgroundImage:
		"radial-gradient(circle at 20% 12%, rgba(120,90,40,0.07) 1px, transparent 1px), radial-gradient(circle at 78% 64%, rgba(120,90,40,0.06) 1px, transparent 1px)",
	backgroundSize: "20px 20px, 28px 28px",
	border: "1px solid #c9b791",
	boxShadow: "2px 6px 18px -8px rgba(80,60,30,0.45)",
};

/** tilt → rotation (deg) of the pinned polaroid (applied inline). */
const TILT_DEG: Record<InnerRenderProps<"polaroid">["params"]["tilt"], number> =
	{
		left: -5,
		straight: 0,
		right: 5,
	};

export function PolaroidCluster({
	topic,
	index,
	params,
	accent,
	children,
}: InnerRenderProps<"polaroid">) {
	const tilt = TILT_DEG[params.tilt];

	return (
		<div className={`w-full ${DENSITY_MAXW[params.density]}`}>
			<div
				className="relative px-7 md:px-10 pt-12 pb-9 md:pt-10"
				style={BOARD_STYLE}
			>
				{/* polaroid pinned in the top-right corner */}
				<div
					className="polaroid absolute -top-6 -right-3 md:-right-6 w-40 md:w-48 shrink-0 z-10"
					style={{ transform: `rotate(${tilt}deg)` }}
				>
					{params.tape && <span className="polaroid-tape" aria-hidden="true" />}
					<div
						className="polaroid-photo flex items-center justify-center"
						style={{ background: accent }}
					>
						<img
							src={flourishSrc(topic.id)}
							alt=""
							aria-hidden="true"
							className="w-16 h-16 md:w-20 md:h-20"
							style={{ imageRendering: "pixelated" }}
						/>
					</div>
					<div className="scrapbook-hand text-center text-slate-700 text-sm py-2 leading-none">
						no. {String(index + 1).padStart(2, "0")}
					</div>
				</div>

				<h2 className="scrapbook-hand font-black tracking-tight text-3xl md:text-5xl text-slate-900 leading-none pr-28 md:pr-32">
					{topic.heading}
				</h2>

				<div className="mt-5">{children}</div>
			</div>
		</div>
	);
}
