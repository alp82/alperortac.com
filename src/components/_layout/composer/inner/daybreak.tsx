import type { InnerRenderProps } from "../types";
import { DENSITY_HEADING, DENSITY_MAXW } from "./shared";

/*
 * Inner: daybreak (time of day)
 *
 * A warm sky frame: a soft vertical sky gradient with a low sun glow and
 * optional radiating rays behind the cluster. The `sky` knob slides it across
 * the day - dawn (pink), golden hour (amber), or dusk (violet→orange) - so one
 * style covers several points in the scroll narrative. Light surface; dark text.
 *
 * Signature toggle = the rays (slow spin, reduced-motion safe via composer.css).
 */

const SKY: Record<
	"dawn" | "golden" | "dusk",
	{ top: string; bottom: string; sun: string; ray: string }
> = {
	dawn: { top: "#fbe4ec", bottom: "#fdd9b6", sun: "#fb7185", ray: "#fda4af" },
	golden: { top: "#fef3c7", bottom: "#fdba74", sun: "#f59e0b", ray: "#fbbf24" },
	dusk: { top: "#c4b5fd", bottom: "#fb923c", sun: "#f97316", ray: "#fdba74" },
};

export function DaybreakCluster({
	topic,
	index,
	params,
	children,
}: InnerRenderProps<"daybreak">) {
	const s = SKY[params.sky];

	return (
		<div className={`relative w-full ${DENSITY_MAXW[params.density]}`}>
			{/* sky wash + sun glow, behind content */}
			<div
				className="pointer-events-none absolute -inset-x-8 -inset-y-10 overflow-hidden rounded-[2rem]"
				aria-hidden="true"
				style={{
					background: `linear-gradient(180deg, ${s.top}, ${s.bottom})`,
					opacity: 0.6,
				}}
			>
				{/* radiating rays behind the sun */}
				{params.rays && (
					<div
						className="cmp-sun-rays absolute left-1/2 bottom-[6%] h-[120%] w-[120%] -translate-x-1/2"
						style={{
							background: `repeating-conic-gradient(from 0deg at 50% 100%, ${s.ray} 0deg 2deg, transparent 2deg 11deg)`,
							WebkitMaskImage:
								"radial-gradient(circle at 50% 100%, #000 0%, transparent 62%)",
							maskImage:
								"radial-gradient(circle at 50% 100%, #000 0%, transparent 62%)",
							opacity: 0.5,
						}}
					/>
				)}
				{/* sun disc on the horizon */}
				<span
					className="absolute left-1/2 bottom-[2%] h-24 w-24 -translate-x-1/2 rounded-full"
					style={{
						background: `radial-gradient(circle, ${s.sun} 0%, ${s.sun} 45%, transparent 72%)`,
						filter: "blur(2px)",
					}}
				/>
			</div>

			<div className="relative z-10 flex flex-col items-center text-center gap-5">
				<div
					className="font-mono text-[11px] uppercase tracking-[0.35em]"
					style={{ color: s.sun }}
				>
					☀ daybreak {String(index + 1).padStart(2, "0")}
				</div>
				<h2
					className={`${DENSITY_HEADING[params.density]} font-black uppercase tracking-tighter text-slate-900 leading-[0.9]`}
				>
					{topic.heading}
				</h2>
				<div className="w-full text-left">{children}</div>
			</div>
		</div>
	);
}
