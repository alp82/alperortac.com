import type { InnerRenderProps } from "../types";
import { DENSITY_MAXW } from "./shared";

/*
 * Inner: ticket-stub — "wide ticket."
 *
 * A WIDE event ticket: a bold accent stub forms a SIDE ACCENT RAIL (ADMIT ONE,
 * ticket no., a printed barcode), a perforated tear line divides it from the
 * main ticket body, where the GENERAL-ADMISSION chrome + the heading sit above
 * the topic's REAL body (the shared light plate) seated as the ticket content.
 * Widened so the body holds the plate. Signature motif (params.motif) = the
 * perforation tear line (notches + dashed seam).
 */

export function TicketStubCluster({
	topic,
	index,
	params,
	accent,
	children,
}: InnerRenderProps) {
	const num = String(index + 1).padStart(2, "0");

	return (
		<div className={`w-full ${DENSITY_MAXW[params.density]}`}>
			<div
				className="ticket relative flex"
				style={{ "--ticket-accent": accent } as React.CSSProperties}
			>
				{/* stub rail */}
				<div
					className="ticket-stub relative flex flex-col items-center justify-between px-4 py-6 shrink-0"
					style={{ background: accent }}
				>
					<span className="font-mono text-[10px] uppercase tracking-[0.3em] text-slate-900/70 [writing-mode:vertical-rl] rotate-180">
						admit one
					</span>
					<span className="font-black text-2xl text-slate-900">{num}</span>
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
				{params.motif && <span className="ticket-perf" aria-hidden="true" />}
				{/* body */}
				<div className="flex-1 px-6 py-6 text-left">
					<div className="font-mono text-[10px] uppercase tracking-[0.3em] text-slate-500 mb-2">
						general admission
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
