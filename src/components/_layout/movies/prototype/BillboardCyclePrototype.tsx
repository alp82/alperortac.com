/*
 * PROTOTYPE — Variant B: favorite posters cycling INSIDE the streaming
 * billboard's featured-title zone. An absolutely-positioned artwork panel
 * sits right-aligned behind the title (masked into the glow wash), channel-
 * zapping sequentially through the pool, with a "NOW SHOWING" chip naming
 * the current title.
 */
import { useEffect, useState } from "react";
import { PROTOTYPE_POSTERS } from "./posters";
import "./prototype.css";

const INTERVAL_MS = 3800;
const OUT_MS = 180;
const IN_MS = 280;

export function BillboardCyclePrototype() {
	const [index, setIndex] = useState(0);
	const [phase, setPhase] = useState<"idle" | "out" | "in">("idle");

	useEffect(() => {
		const timeouts: ReturnType<typeof setTimeout>[] = [];
		const interval = setInterval(() => {
			setPhase("out");
			timeouts.push(
				setTimeout(() => {
					setIndex((i) => (i + 1) % PROTOTYPE_POSTERS.length);
					setPhase("in");
					timeouts.push(setTimeout(() => setPhase("idle"), IN_MS));
				}, OUT_MS),
			);
		}, INTERVAL_MS);
		return () => {
			clearInterval(interval);
			for (const t of timeouts) clearTimeout(t);
		};
	}, []);

	const poster = PROTOTYPE_POSTERS[index] ?? PROTOTYPE_POSTERS[0];
	if (!poster) return null;
	const zapClass =
		phase === "out" ? "proto-zap--out" : phase === "in" ? "proto-zap--in" : "";

	return (
		<div
			className="absolute inset-0 overflow-hidden pointer-events-none"
			aria-hidden="true"
		>
			{/* right-aligned artwork panel, masked into the billboard wash */}
			<div
				className={`proto-zap ${zapClass} absolute inset-y-0 right-0 w-3/5 md:w-2/5`}
				style={{
					maskImage:
						"linear-gradient(to right, transparent 0%, black 45%, black 100%)",
					WebkitMaskImage:
						"linear-gradient(to right, transparent 0%, black 45%, black 100%)",
				}}
			>
				<img
					src={poster.src}
					alt=""
					className="proto-zap-content w-full h-full object-cover opacity-70"
				/>
				<span className="proto-static" />
				{/* NOW SHOWING chip, pinned to the panel's lower edge */}
				<span className="absolute bottom-2 right-2 rounded bg-black/70 px-2 py-1 text-[10px] font-bold tracking-[0.14em] text-white/90">
					NOW SHOWING · {poster.title.toUpperCase()} ({poster.year})
				</span>
			</div>
		</div>
	);
}
