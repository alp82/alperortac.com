import { flourishSrc, type InnerRenderProps } from "../types";
import { DENSITY_MAXW } from "./shared";

/*
 * Inner: seed-packet — "garden seed packet."
 *
 * A whimsical heirloom seed packet: an accent-tinted illustration band up top
 * (the topic flourish when params.illustration is on), a VARIETY eyebrow + the
 * heading as the variety name, a catalog sub-line, the topic's REAL body (the
 * shared plate) as the growing notes, and a dashed "sow-by" strip at the foot.
 * Signature toggle (illustration) = the flourish on the band; theming knob
 * (stock) = the packet's paper + ink (cream / kraft / sage).
 */

/* stock → { paper, ink } — packet stock + printed ink. */
const STOCK: Record<
	"cream" | "kraft" | "sage",
	{ paper: string; ink: string }
> = {
	cream: { paper: "#f6efdd", ink: "#3a3320" },
	kraft: { paper: "#e3d6bb", ink: "#3a2c16" },
	sage: { paper: "#e4ebdd", ink: "#2f3a2a" },
};

export function SeedPacketCluster({
	topic,
	index,
	params,
	accent,
	children,
}: InnerRenderProps<"seed-packet">) {
	const s = STOCK[params.stock];
	const no = String(index + 1).padStart(2, "0");
	const sowDays = (index + 1) * 7;

	return (
		<div className={`w-full ${DENSITY_MAXW[params.density]}`}>
			<div
				className="overflow-hidden rounded-sm"
				style={{
					backgroundColor: s.paper,
					border: `2px solid ${s.ink}`,
					boxShadow: "2px 6px 20px -10px rgba(50,40,20,0.5)",
				}}
			>
				{/* illustration band — accent-tinted, flourish optional */}
				<div
					className="flex items-center justify-center h-24 md:h-28"
					style={{
						backgroundColor: `color-mix(in srgb, ${accent} 35%, transparent)`,
						borderBottom: `1px solid ${s.ink}`,
					}}
				>
					{params.illustration && (
						<img
							src={flourishSrc(topic.id)}
							alt=""
							aria-hidden="true"
							className="w-16 h-16"
							style={{ imageRendering: "pixelated" }}
						/>
					)}
				</div>

				<div className="px-6 md:px-8 pt-5 pb-6">
					{/* eyebrow + variety name + catalog sub */}
					<div
						className="font-mono text-[10px] uppercase tracking-[0.3em]"
						style={{ color: s.ink, opacity: 0.6 }}
					>
						Variety
					</div>
					<h2
						className="font-black uppercase tracking-tight text-3xl md:text-5xl leading-none mt-1"
						style={{ color: s.ink }}
					>
						{topic.heading}
					</h2>
					<div
						className="font-mono text-[11px] uppercase tracking-wide mt-2"
						style={{ color: s.ink, opacity: 0.75 }}
					>
						No. {no} · Heirloom
					</div>

					{/* growing notes (the topic body) */}
					<div className="mt-5">{children}</div>
				</div>

				{/* sow-by strip — dashed ink divider */}
				<div
					className="px-6 md:px-8 py-3 font-mono text-[10px] uppercase tracking-[0.25em]"
					style={{ color: s.ink, borderTop: `1px dashed ${s.ink}` }}
				>
					SOW ☀ FULL SUN · {sowDays} DAYS
				</div>
			</div>
		</div>
	);
}
