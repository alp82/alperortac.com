import type { InnerRenderProps } from "../types";
import { DENSITY_HEADING, DENSITY_MAXW } from "./shared";

/*
 * Inner: summit (nature)
 *
 * Layered mountain-ridge silhouettes under a graded sky sit at the foot of the
 * block - a far range (lighter) behind a near range (darker), for depth. The
 * `range` knob sets the sky/rock palette (dawn / dusk / night); the signature
 * toggle adds snow caps on the near peaks. Fits the high points of the journey.
 */

const RANGE: Record<
	"dawn" | "dusk" | "night",
	{ top: string; bottom: string; far: string; near: string; dark: boolean }
> = {
	dawn: {
		top: "#fad7e0",
		bottom: "#fde9c8",
		far: "#9aa9c4",
		near: "#5b6b86",
		dark: false,
	},
	dusk: {
		top: "#3b2f63",
		bottom: "#f0895d",
		far: "#5b4a7e",
		near: "#241a3a",
		dark: true,
	},
	night: {
		top: "#0b1026",
		bottom: "#243049",
		far: "#1b2540",
		near: "#0a0f1f",
		dark: true,
	},
};

export function SummitCluster({
	topic,
	index,
	params,
	children,
}: InnerRenderProps<"summit">) {
	const r = RANGE[params.range];

	return (
		<div className={`relative w-full ${DENSITY_MAXW[params.density]}`}>
			{/* sky wash + ridges at the foot, behind content */}
			<div
				className="pointer-events-none absolute -inset-x-8 -inset-y-10 overflow-hidden rounded-[2rem]"
				aria-hidden="true"
				style={{
					background: `linear-gradient(180deg, ${r.top}, ${r.bottom})`,
					opacity: 0.55,
				}}
			>
				<svg
					className="absolute inset-x-0 bottom-0 h-[46%] w-full"
					viewBox="0 0 100 40"
					preserveAspectRatio="none"
					aria-hidden="true"
				>
					<title>mountains</title>
					{/* far range */}
					<polygon
						points="0,40 0,22 18,11 34,21 52,6 70,20 86,10 100,21 100,40"
						fill={r.far}
						opacity={0.7}
					/>
					{/* near range */}
					<polygon
						points="0,40 0,30 22,16 40,28 58,14 78,29 100,18 100,40"
						fill={r.near}
					/>
					{/* snow caps on the near peaks */}
					{params.snow && (
						<>
							<polygon
								points="22,16 18,20 26,20"
								fill="#f8fafc"
								opacity={0.9}
							/>
							<polygon
								points="58,14 54,18 62,18"
								fill="#f8fafc"
								opacity={0.9}
							/>
						</>
					)}
				</svg>
			</div>

			<div className="relative z-10 flex flex-col items-center text-center gap-5">
				<div
					className="font-mono text-[11px] uppercase tracking-[0.35em]"
					style={{ color: r.dark ? "#e2e8f0" : "#475569" }}
				>
					▲ summit {String(index + 1).padStart(2, "0")}
				</div>
				<h2
					className={`${DENSITY_HEADING[params.density]} font-black uppercase tracking-tighter leading-[0.9] ${r.dark ? "text-white [text-shadow:0_2px_12px_rgba(0,0,0,0.5)]" : "text-slate-900"}`}
				>
					{topic.heading}
				</h2>
				<div className="w-full text-left">{children}</div>
			</div>
		</div>
	);
}
