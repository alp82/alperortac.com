/*
 * PROTOTYPE — Variant A (round 2): the flickering 3×2 poster grid seated
 * under the billboard prose, acting (as a stub) as the trigger into the
 * future favorites subpage.
 *
 * Round-2 refinement from the walk: the billboard's category pills moved
 * DOWN from the top chrome onto the grid as FUNCTIONAL filters (All / Films
 * / Series) — they filter both the visible cells and the channel-zap
 * rotation pool. The top-chrome pills disappear in this variant (see
 * streaming-billboard.tsx).
 */
import { useEffect, useRef, useState } from "react";
import { PROTOTYPE_POSTERS, type PrototypePoster } from "./posters";
import "./prototype.css";

const VISIBLE = 6;
const INTERVAL_MS = 2600;
const OUT_MS = 180;
const IN_MS = 280;

type Zap = { cell: number; phase: "out" | "in" } | null;
type Filter = "all" | "film" | "series";

const FILTERS: { key: Filter; label: string }[] = [
	{ key: "all", label: "All" },
	{ key: "film", label: "Films" },
	{ key: "series", label: "Series" },
];

function pool(filter: Filter): PrototypePoster[] {
	if (filter === "all") return PROTOTYPE_POSTERS;
	return PROTOTYPE_POSTERS.filter((p) => p.kind === filter);
}

export function PosterGridPrototype() {
	const [filter, setFilter] = useState<Filter>("all");
	const [visible, setVisible] = useState<PrototypePoster[]>(() =>
		pool("all").slice(0, VISIBLE),
	);
	const [zap, setZap] = useState<Zap>(null);
	const [paused, setPaused] = useState(false);
	const stateRef = useRef({ visible, zap, paused, filter });
	stateRef.current = { visible, zap, paused, filter };

	const pickFilter = (f: Filter) => {
		setFilter(f);
		setZap(null);
		setVisible(pool(f).slice(0, VISIBLE));
	};

	useEffect(() => {
		const timeouts: ReturnType<typeof setTimeout>[] = [];
		const interval = setInterval(() => {
			const s = stateRef.current;
			if (s.paused || s.zap) return;
			const hidden = pool(s.filter).filter(
				(p) => !s.visible.some((v) => v.slug === p.slug),
			);
			const replacement = hidden[Math.floor(Math.random() * hidden.length)];
			if (!replacement) return; // filtered pool fits the grid — rotation idles
			const cell = Math.floor(Math.random() * VISIBLE);
			setZap({ cell, phase: "out" });
			timeouts.push(
				setTimeout(() => {
					setVisible((prev) => {
						const next = [...prev];
						next[cell] = replacement;
						return next;
					});
					setZap({ cell, phase: "in" });
					timeouts.push(setTimeout(() => setZap(null), IN_MS));
				}, OUT_MS),
			);
		}, INTERVAL_MS);
		return () => {
			clearInterval(interval);
			for (const t of timeouts) clearTimeout(t);
		};
	}, []);

	const count = pool(filter).length;

	return (
		<div className="relative px-6 md:px-9 pb-6">
			{/* the relocated pills — functional filters, no longer top-chrome theater */}
			<div className="flex items-center justify-between mb-3">
				<div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.08em]">
					{FILTERS.map((f) => (
						<button
							key={f.key}
							type="button"
							onClick={() => pickFilter(f.key)}
							className={`sbb-pill cursor-pointer ${filter === f.key ? "sbb-pill--on" : "opacity-60 hover:opacity-100"}`}
							aria-pressed={filter === f.key}
						>
							{f.label}
						</button>
					))}
				</div>
				<span className="text-[11px] font-bold tracking-[0.2em] text-white/70">
					ALL-TIME FAVORITES
				</span>
			</div>
			{/* stub trigger — the real build navigates to the favorites subpage */}
			<button
				type="button"
				className="group block w-full text-left cursor-pointer"
				aria-label="All-time favorites (prototype stub — subpage not built yet)"
				onMouseEnter={() => setPaused(true)}
				onMouseLeave={() => setPaused(false)}
			>
				<div className="grid grid-cols-3 gap-2 md:gap-3">
					{visible.map((poster, i) => {
						const zapClass =
							zap?.cell === i
								? zap.phase === "out"
									? "proto-zap--out"
									: "proto-zap--in"
								: "";
						return (
							<div
								key={poster.slug}
								className={`proto-zap ${zapClass} aspect-[2/3] rounded-md ring-1 ring-white/15 group-hover:ring-white/30 transition-shadow`}
							>
								<img
									src={poster.src}
									alt={`${poster.title} poster`}
									className="proto-zap-content w-full h-full object-cover rounded-md"
									loading="lazy"
								/>
								<span className="proto-static rounded-md" aria-hidden="true" />
							</div>
						);
					})}
				</div>
				<div className="mt-2 text-right text-[11px] font-semibold text-white/50 group-hover:text-white/90 transition-colors">
					browse all {count} →
				</div>
			</button>
		</div>
	);
}
