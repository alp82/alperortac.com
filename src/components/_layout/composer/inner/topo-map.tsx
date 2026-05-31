import type { InnerRenderProps } from "../types";
import { TOPICS } from "../../../../data/topics";
import { DENSITY_MAXW } from "./shared";

/*
 * Inner: topo-map — "topographic survey sheet."
 *
 * A light parchment survey card that ties into the site's scroll-journey / dig
 * theme: the heading reads as a surveyed PLACE-LABEL with a benchmark elevation,
 * a faint coordinate line, then the topic's REAL body (the shared plate) as the
 * survey notes, and a sheet-number footer. Signature toggle (params.contours) =
 * concentric elevation rings drawn behind the notes; theming knob (terrain) =
 * the parchment + ink + contour palette (forest / desert / alpine).
 */

/* terrain → { paper, contour, ink } — parchment stock + elevation-line ink. */
const TERRAIN: Record<
	"forest" | "desert" | "alpine",
	{ paper: string; contour: string; ink: string }
> = {
	forest: { paper: "#eef3e6", contour: "#6f8f5a", ink: "#2f3d24" },
	desert: { paper: "#f5ecd9", contour: "#c9a06a", ink: "#5a4324" },
	alpine: { paper: "#e9eef3", contour: "#7d93a8", ink: "#2c3a47" },
};

export function TopoMapCluster({
	topic,
	index,
	params,
	children,
}: InnerRenderProps<"topo-map">) {
	const t = TERRAIN[params.terrain];
	const elevation = `${(index + 1) * 137} m`;
	const coords = `N 48°${10 + index}′ · E 11°${20 + index}′`;
	const sheet = `SHEET ${String(index + 1).padStart(2, "0")} / ${String(
		TOPICS.length,
	).padStart(2, "0")} · ${topic.id}`;

	return (
		<div className={`w-full ${DENSITY_MAXW[params.density]}`}>
			<div
				className="relative overflow-hidden rounded-xl px-6 md:px-9 py-8"
				style={{
					backgroundColor: t.paper,
					border: `1px solid ${t.contour}`,
					boxShadow: "2px 6px 20px -10px rgba(40,50,30,0.45)",
				}}
			>
				{/* elevation lines — concentric irregular contour rings */}
				{params.contours && (
					<svg
						className="absolute -right-12 -top-10 w-[120%] h-[140%]"
						viewBox="0 0 200 200"
						fill="none"
						stroke={t.contour}
						strokeWidth={1}
						aria-hidden="true"
						style={{ opacity: 0.4 }}
					>
						<path d="M100 36c34 4 56 26 52 58s-30 50-62 46-56-28-50-60 26-48 60-44Z" />
						<path d="M100 54c26 2 42 20 39 44s-23 38-47 35-42-21-38-45 20-36 46-34Z" />
						<path d="M100 72c17 1 28 14 26 30s-15 25-31 23-28-14-25-30 13-24 30-23Z" />
						<ellipse cx="100" cy="103" rx="13" ry="11" />
						<ellipse cx="100" cy="103" rx="5" ry="4" />
					</svg>
				)}

				{/* survey place-label + benchmark marker */}
				<div className="relative flex items-baseline justify-between gap-4">
					<h2
						className="font-black uppercase tracking-tight text-3xl md:text-5xl leading-none"
						style={{ color: t.ink }}
					>
						{topic.heading}
					</h2>
					<span
						className="font-mono text-[11px] shrink-0 whitespace-nowrap"
						style={{ color: t.contour }}
						aria-hidden="true"
					>
						▲ {elevation}
					</span>
				</div>

				{/* coordinate line */}
				<div
					className="relative mt-1 font-mono text-[10px] tracking-wide"
					style={{ color: t.ink, opacity: 0.6 }}
				>
					{coords}
				</div>

				{/* survey notes (the topic body) */}
				<div className="relative mt-5">{children}</div>

				{/* sheet number footer */}
				<div
					className="relative mt-6 font-mono text-[10px] uppercase tracking-[0.25em]"
					style={{ color: t.contour }}
				>
					{sheet}
				</div>
			</div>
		</div>
	);
}
