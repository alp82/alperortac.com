/**
 * Three drifting cloud puffs in the fixed sky layer.
 *
 * Animation is gated entirely in CSS (`@media (prefers-reduced-motion:
 * no-preference)`), so reduced-motion users see static clouds with zero
 * JS branching here.
 *
 * Sizing uses inline styles for the per-cloud diameter / vertical band;
 * everything else is Tailwind utility classes plus the `.cloud-puff` /
 * `.cloud-drift-*` classes from `styles.css`.
 */

type CloudConfig = {
	id: string;
	top: string;
	size: number;
	speedClass: "cloud-drift-slow" | "cloud-drift-medium" | "cloud-drift-fast";
	delay: string;
	opacity: number;
};

const CLOUDS: ReadonlyArray<CloudConfig> = [
	{
		id: "cloud-a",
		top: "12%",
		size: 96,
		speedClass: "cloud-drift-slow",
		delay: "-15s",
		opacity: 0.95,
	},
	{
		id: "cloud-b",
		top: "26%",
		size: 72,
		speedClass: "cloud-drift-medium",
		delay: "-32s",
		opacity: 0.85,
	},
	{
		id: "cloud-c",
		top: "40%",
		size: 110,
		speedClass: "cloud-drift-fast",
		delay: "-7s",
		opacity: 0.78,
	},
];

export function Clouds(): React.ReactElement {
	return (
		<div
			aria-hidden="true"
			className="pointer-events-none fixed inset-0 z-10 overflow-hidden"
		>
			{CLOUDS.map((c) => (
				<div
					key={c.id}
					className={`cloud-drift ${c.speedClass} absolute`}
					style={{
						top: c.top,
						animationDelay: c.delay,
						willChange: "transform",
					}}
				>
					<div
						className="cloud-puff"
						style={{
							width: `${c.size}px`,
							height: `${Math.round(c.size * 0.42)}px`,
							opacity: c.opacity,
						}}
					/>
				</div>
			))}
		</div>
	);
}
