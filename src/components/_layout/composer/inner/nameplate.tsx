import type { InnerRenderProps } from "../types";
import { DENSITY_MAXW } from "./shared";

/*
 * Inner: nameplate - "engraved door plate."
 *
 * A metal nameplate: an accent-tinted header band carries the heading as the big
 * engraved title, and a slim engraved role line runs beneath it on a fixed dark
 * bar (light ink on dark - clears WCAG AA). The sheen is always-on atmosphere,
 * clipped to the header band - it never washes over the prose. Signature toggle
 * (params.screws) = the four small corner mount screws; theming knob (role) picks
 * the engraved role-line wording (title / tenure / focus). The title label
 * carries the user's real verbatim wording (wayfinder #11 lock); tenure/focus
 * remain neutral placeholders until he supplies their words.
 */

/** role → the engraved role line's wording. Plain "-" only. */
const ROLE: Record<
	InnerRenderProps<"nameplate">["params"]["role"],
	{ label: string }
> = {
	title: { label: "Engineer, founder, consultant" },
	tenure: { label: "SINCE - YEAR" },
	focus: { label: "FOCUS - AREA" },
};

/** The four corner offsets for the mount screws, band-scoped. */
const SCREW_CORNERS = [
	{ key: "tl", top: 8, left: 8 },
	{ key: "tr", top: 8, right: 8 },
	{ key: "bl", bottom: 8, left: 8 },
	{ key: "br", bottom: 8, right: 8 },
] as const;

export function NameplateCluster({
	topic,
	params,
	accent,
	children,
}: InnerRenderProps<"nameplate">) {
	return (
		<div className={`w-full ${DENSITY_MAXW[params.density]}`}>
			<div className="nameplate-card">
				{/* header band - accent-tinted plate, sheen + screws clipped to it */}
				<div
					className="nameplate-band px-6 md:px-8 pt-6 pb-5"
					style={{
						backgroundColor: `color-mix(in srgb, ${accent} 55%, #ffffff)`,
					}}
				>
					<span
						className="nameplate-sheen"
						aria-hidden="true"
						style={{ pointerEvents: "none" }}
					/>
					{params.screws &&
						SCREW_CORNERS.map(({ key, ...offset }) => (
							<span
								key={key}
								className="nameplate-screw"
								aria-hidden="true"
								style={offset}
							/>
						))}
					<h2 className="font-black uppercase tracking-tight text-3xl md:text-5xl text-slate-900 leading-none">
						{topic.heading}
					</h2>
				</div>

				{/* engraved role line - fixed light ink on a dark bar (AA) */}
				<div
					className="nameplate-role px-6 md:px-8 py-2 font-mono text-[11px] uppercase tracking-[0.35em]"
					style={{ backgroundColor: "#0f172a", color: "#f8fafc" }}
				>
					{ROLE[params.role].label}
				</div>

				{/* plate body (the topic body) */}
				<div className="px-6 md:px-8 py-6 text-left">{children}</div>
			</div>
		</div>
	);
}
