/**
 * Drifting cloud puffs in the far parallax layer.
 *
 * Three differentiated speed bands give a sense of depth while the
 * parallax wrapper drifts the whole layer up subtly with scroll.
 *
 * Animation is gated entirely in CSS (`@media (prefers-reduced-motion:
 * no-preference)`); reduced-motion users get static clouds with zero
 * JS branching here.
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
		top: "8vh",
		size: 96,
		speedClass: "cloud-drift-fast",
		delay: "-7s",
		opacity: 0.95,
	},
	{
		id: "cloud-b",
		top: "16vh",
		size: 64,
		speedClass: "cloud-drift-medium",
		delay: "-22s",
		opacity: 0.85,
	},
	{
		id: "cloud-c",
		top: "26vh",
		size: 120,
		speedClass: "cloud-drift-slow",
		delay: "-44s",
		opacity: 0.9,
	},
	{
		id: "cloud-d",
		top: "13vh",
		size: 54,
		speedClass: "cloud-drift-medium",
		delay: "-12s",
		opacity: 0.7,
	},
	{
		id: "cloud-e",
		top: "38vh",
		size: 78,
		speedClass: "cloud-drift-slow",
		delay: "-30s",
		opacity: 0.6,
	},
	{
		id: "cloud-f",
		top: "46vh",
		size: 58,
		speedClass: "cloud-drift-fast",
		delay: "-50s",
		opacity: 0.55,
	},
];

export function Clouds(): React.ReactElement {
	return (
		<div aria-hidden="true" className="parallax-layer parallax-far z-[10]">
			{CLOUDS.map((c) => (
				<div
					key={c.id}
					className={`cloud-drift ${c.speedClass} absolute`}
					style={{
						top: c.top,
						animationDelay: c.delay,
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
