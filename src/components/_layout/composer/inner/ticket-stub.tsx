import { ROUTE_NEXT, ROUTE_STOPS } from "../../../../data/travel";
import type { InnerRenderProps } from "../types";
import { DENSITY_MAXW } from "./shared";

/*
 * Inner: ticket-stub - "wide ticket."
 *
 * A WIDE event ticket: a bold stub forms a SIDE ACCENT RAIL (BOARDING PASS,
 * ticket no., a printed barcode), a perforated tear line divides it from the
 * main ticket body, where the route-strip chrome + the heading sit above
 * the topic's REAL body (the shared light plate) seated as the ticket content.
 * Widened so the body holds the plate. Signature toggle (params.perforation) =
 * the perforation tear line (notches + dashed seam); `color` recolors both the
 * stub rail bg and the `--ticket-accent` var inline.
 *
 * Route strip (wayfinder #17, the Travel lock's media treatment): a
 * boarding-pass route line printed in the header slot above the heading -
 * visited stops joined by a solid-dot dashed path, the next leg dashed in
 * the ticket accent with a plane glyph. ROUTE_STOPS/ROUTE_NEXT are the single
 * source in src/data/travel.ts (shared with the Travel globe subpage).
 */

/** color → the stub rail bg + the `--ticket-accent` var (applied inline). */
const TICKET_COLOR: Record<
	InnerRenderProps<"ticket-stub">["params"]["color"],
	string
> = {
	crimson: "#e23b54",
	indigo: "#818cf8",
	gold: "#d4a017",
};

export function TicketStubCluster({
	topic,
	params,
	children,
}: InnerRenderProps<"ticket-stub">) {
	const ticketColor = TICKET_COLOR[params.color];

	return (
		<div className={`w-full ${DENSITY_MAXW[params.density]}`}>
			<div
				className="ticket relative flex"
				style={{ "--ticket-accent": ticketColor } as React.CSSProperties}
			>
				{/* stub rail */}
				<div
					className="ticket-stub relative flex flex-col items-center justify-between px-4 py-6 shrink-0"
					style={{ background: ticketColor }}
				>
					<span className="font-mono text-[10px] uppercase tracking-[0.3em] text-slate-900/70 [writing-mode:vertical-rl] rotate-180">
						boarding pass
					</span>
					<span className="font-black text-2xl text-slate-900">AO 27</span>
					{/* printed barcode */}
					<span
						className="w-5 h-12"
						aria-hidden="true"
						style={{
							background:
								"repeating-linear-gradient(90deg, rgba(15,23,42,0.85) 0 1px, transparent 1px 3px)",
						}}
					/>
				</div>
				{params.perforation && (
					<span className="ticket-perf" aria-hidden="true" />
				)}
				{/* body */}
				<div className="flex-1 px-6 py-6 text-left">
					{/* route strip - boarding-pass header line (see file note) */}
					<div className="ticket-route mb-3">
						<div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">
							<span className="tracking-[0.3em] mr-1">route</span>
							{ROUTE_STOPS.map((stop) => (
								<span key={stop} className="flex items-center gap-2 min-w-0">
									<span className="whitespace-nowrap">{stop}</span>
									<span
										className="flex-none w-4 border-t border-dashed border-slate-400"
										aria-hidden="true"
									/>
								</span>
							))}
							<span
								className="flex-1 min-w-4 border-t border-dashed"
								style={{ borderColor: "var(--ticket-accent)" }}
								aria-hidden="true"
							/>
							<span
								aria-hidden="true"
								style={{ color: "var(--ticket-accent)" }}
							>
								✈
							</span>
							<span
								className="whitespace-nowrap font-bold"
								style={{ color: "var(--ticket-accent)" }}
							>
								{ROUTE_NEXT}
							</span>
						</div>
					</div>
					<h2 className="font-black uppercase tracking-tight text-3xl md:text-4xl text-slate-900 leading-none">
						{topic.heading}
					</h2>

					<div className="mt-4">{children}</div>
				</div>
			</div>
		</div>
	);
}
