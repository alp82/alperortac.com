import type { InnerRenderProps } from "../types";
import { DENSITY_MAXW } from "./shared";

/*
 * Inner: status-page - "SaaS status card."
 *
 * A modern service status page is the frame: a clean rounded card with a
 * status pill (live dot + message), the heading as the monitored service
 * name, a decorative 90-day uptime tick row (toggle) with its mono uptime
 * figure, the topic's REAL body seated clear in the middle, and a mono
 * "checked just now" footer. Signature toggle (params.bars) = the uptime
 * history row; theming knob (status) = the reported state (operational /
 * degraded / maintenance) which recolors the dot, pill and dip ticks via
 * records applied inline (terminal SCHEMES convention). Card paper/ink are
 * fixed constants handed to the `.sp-*` classes as --sp-paper / --sp-ink
 * inline vars (the pull-request carve-out: the card is STATE-driven, not
 * stock-driven). The dot's pulse is stilled under reduced motion. The tick
 * row is pure theater - fixed dip positions, no data behind it.
 */

/* Fixed card constants - identical across all three states by design. */
const SP_PAPER = "#ffffff";
const SP_INK = "#0f172a";

/** status → { label, tone, uptime } - pill message, state color, mono figure. */
const STATUS: Record<
	InnerRenderProps<"status-page">["params"]["status"],
	{ label: string; tone: string; uptime: string }
> = {
	operational: {
		label: "All systems operational",
		tone: "#059669",
		uptime: "99.98% uptime",
	},
	degraded: {
		label: "Degraded performance",
		tone: "#d97706",
		uptime: "97.31% uptime",
	},
	maintenance: {
		label: "Scheduled maintenance",
		tone: "#2563eb",
		uptime: "under maintenance",
	},
};

/** Fixed dip positions in the 48-tick row - deterministic theater (no
 * randomness, SSR-stable). Dips render in the state tone; the rest stay
 * healthy green. */
const DIPS = new Set([9, 24, 25, 38]);

/** The tick row as data-first objects so keys come off the item, not the map
 * index (biome noArrayIndexKey - the pull-request SQUARE_KEYS move, scaled). */
const TICKS = Array.from({ length: 48 }, (_, i) => ({
	id: `day-${i + 1}`,
	dip: DIPS.has(i),
}));

const HEALTHY = "#10b981";

export function StatusPageCluster({
	topic,
	params,
	children,
}: InnerRenderProps<"status-page">) {
	const st = STATUS[params.status];

	return (
		<div className={`w-full ${DENSITY_MAXW[params.density]}`}>
			<div
				className="sp-card text-left"
				style={
					{
						"--sp-paper": SP_PAPER,
						"--sp-ink": SP_INK,
						"--sp-tone": st.tone,
						backgroundColor: SP_PAPER,
						color: SP_INK,
					} as React.CSSProperties
				}
			>
				{/* header - status pill, service name, uptime row */}
				<div className="sp-head px-6 md:px-8 pt-5 pb-4">
					<span className="sp-pill inline-flex items-center gap-2 text-xs font-semibold">
						<span className="sp-dot" aria-hidden="true" />
						{st.label}
					</span>
					<h2 className="mt-3 font-bold text-3xl md:text-5xl leading-tight">
						{topic.heading}
					</h2>
					{params.bars && (
						<div className="mt-4">
							<span
								className="sp-ticks flex items-end gap-[3px]"
								aria-hidden="true"
							>
								{TICKS.map((t) => (
									<span
										key={t.id}
										className={`sp-tick ${t.dip ? "sp-tick--dip" : ""}`}
										style={{
											backgroundColor: t.dip ? st.tone : HEALTHY,
										}}
									/>
								))}
							</span>
							<span className="sp-uptime mt-2 inline-block font-mono text-xs">
								{st.uptime} · 90 days
							</span>
						</div>
					)}
				</div>

				{/* the monitored service itself - clear of every piece of chrome */}
				<div className="px-6 md:px-8 py-6">{children}</div>

				{/* footer - the monitor's heartbeat line */}
				<div className="sp-foot px-6 md:px-8 py-3 font-mono text-xs">
					checked just now · self-hosted
				</div>
			</div>
		</div>
	);
}
