import { memo, useMemo, useRef, useState } from "react";
import { type CelestialState, DEFAULT_CELESTIAL } from "../data/celestial";
import { DEFAULT_SKY_ANCHORS, type SkyAnchors, skyAt } from "../data/skyCurve";
import {
	moverMasks,
	viewportHeightPctFor,
} from "./_layout/scrollJourney/journeyValues";
import type { Journey } from "./_layout/scrollJourney/useScrollJourney";
import { useJourneyRepaint } from "./_layout/scrollJourney/useScrollJourney";

// The right-edge journey minimap: a snapshot of the whole day/night gradient,
// with the current viewport window shown in live colour and everything outside
// it dimmed.
//
// Nothing here recomputes on scroll. Both masks used to be rebuilt as fresh
// gradient strings every tick, which forced the browser to re-rasterize an
// 80px x 100vh mask each frame. Their shape only depends on the viewport ratio
// (resize), so they are built once here against a 300%-tall layer whose window
// sits at 1/3 of its height; the driver then just translates that layer. See
// journeyValues.ts for the geometry and journeyTargets.ts for the writes.

type MinimapProps = {
	celestial: CelestialState;
	// Atmosphere toy: palette anchors so the minimap gradient mirrors the toy's
	// selected world. Defaults to Earth = unchanged.
	anchors?: SkyAnchors;
	journey?: Journey | undefined;
};

function MinimapInner({
	celestial,
	anchors = DEFAULT_SKY_ANCHORS,
	journey,
}: MinimapProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const indicatorRef = useRef<HTMLDivElement>(null);
	// "jump": press outside the window - the scroll follows the pointer
	// absolutely. "thumb": press inside the window - it acts as a drag handle
	// and only moves once the pointer does, keeping its grab offset.
	const dragModeRef = useRef<"jump" | "thumb" | null>(null);
	const thumbOffsetRef = useRef(0);
	const [grabbing, setGrabbing] = useState(false);

	useJourneyRepaint(journey);

	// Resize-only: the window's height changes, its shape does not.
	const viewportHeightPct = viewportHeightPctFor(journey?.metrics ?? null);
	const masks = useMemo(
		() => moverMasks(viewportHeightPct),
		[viewportHeightPct],
	);

	const minimapGradient = useMemo(() => {
		const STOPS = 48;
		const parts: string[] = [];
		for (let i = 0; i < STOPS; i++) {
			const p = i / (STOPS - 1);
			parts.push(
				`${skyAt(p, celestial.curve, anchors)} ${(p * 100).toFixed(2)}%`,
			);
		}
		return `linear-gradient(to bottom, ${parts.join(", ")})`;
	}, [celestial.curve, anchors]);

	const scrollToY = (clientY: number) => {
		const el = containerRef.current;
		if (!el) return;
		const rect = el.getBoundingClientRect();
		const ratio = Math.min(Math.max((clientY - rect.top) / rect.height, 0), 1);
		const target =
			ratio * (document.documentElement.scrollHeight - window.innerHeight);
		window.scrollTo({ top: target, behavior: "instant" as ScrollBehavior });
	};

	// Thumb drag: place the window's top so the grabbed point stays under the
	// pointer. The window travels containerH - thumbH px over the full scroll
	// range (journeyValues: topPx = progress * (1 - viewportRatio) * H).
	const scrollThumbTo = (clientY: number) => {
		const el = containerRef.current;
		const ind = indicatorRef.current;
		if (!el || !ind) return;
		const rect = el.getBoundingClientRect();
		const travel = rect.height - ind.getBoundingClientRect().height;
		if (travel <= 0) return;
		const top = clientY - thumbOffsetRef.current - rect.top;
		const ratio = Math.min(Math.max(top / travel, 0), 1);
		const target =
			ratio * (document.documentElement.scrollHeight - window.innerHeight);
		window.scrollTo({ top: target, behavior: "instant" as ScrollBehavior });
	};

	const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
		setGrabbing(true);
		e.currentTarget.setPointerCapture(e.pointerId);
		const indRect = indicatorRef.current?.getBoundingClientRect();
		if (indRect && e.clientY >= indRect.top && e.clientY <= indRect.bottom) {
			dragModeRef.current = "thumb";
			thumbOffsetRef.current = e.clientY - indRect.top;
		} else {
			dragModeRef.current = "jump";
			scrollToY(e.clientY);
		}
	};

	const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
		if (dragModeRef.current === "jump") scrollToY(e.clientY);
		else if (dragModeRef.current === "thumb") scrollThumbTo(e.clientY);
	};

	const stopDrag = (e: React.PointerEvent<HTMLDivElement>) => {
		dragModeRef.current = null;
		setGrabbing(false);
		if (e.currentTarget.hasPointerCapture(e.pointerId)) {
			e.currentTarget.releasePointerCapture(e.pointerId);
		}
	};

	// The three layers that track the viewport share one translateY, written by
	// the driver. `top: -100%` + `height: 300%` keeps the mover covering the
	// container across the whole travel range.
	const moverStyle: React.CSSProperties = {
		position: "absolute",
		left: 0,
		right: 0,
		top: "-100%",
		height: "300%",
		transform: "translateY(var(--mm-top-px, 0px))",
		willChange: "transform",
	};

	return (
		<div
			ref={containerRef}
			onPointerDown={handlePointerDown}
			onPointerMove={handlePointerMove}
			onPointerUp={stopDrag}
			onPointerCancel={stopDrag}
			role="presentation"
			aria-hidden="true"
			className={`hidden md:block fixed right-0 top-0 w-20 h-screen border-l-2 border-white/20 ${grabbing ? "cursor-grabbing" : "cursor-grab"} select-none z-40 overflow-hidden touch-none`}
			style={{ background: minimapGradient }}
		>
			{/* live sky colour, revealed only inside the viewport window */}
			<div className="absolute inset-0 overflow-hidden pointer-events-none">
				<div
					ref={(el) => {
						if (journey) journey.targets.mmBand = el;
					}}
					style={{
						...moverStyle,
						backgroundColor: "var(--sky-now)",
						maskImage: masks.band,
						WebkitMaskImage: masks.band,
					}}
				/>
			</div>

			<div
				ref={(el) => {
					if (journey) journey.targets.mmSun = el;
				}}
				className="absolute -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-yellow-200 border border-yellow-400 shadow-[0_0_6px_rgba(253,224,71,0.7)] pointer-events-none"
				style={{
					left: `var(--sun-x, ${DEFAULT_CELESTIAL.sun.startX}%)`,
					top: "var(--mm-sun-y, 0%)",
					opacity: "var(--sun-o, 1)",
				}}
			/>
			<div
				ref={(el) => {
					if (journey) journey.targets.mmMoon = el;
				}}
				className="absolute -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-slate-100 border border-slate-300 pointer-events-none"
				style={{
					left: `var(--moon-x, ${DEFAULT_CELESTIAL.moon.startX}%)`,
					top: "var(--mm-moon-y, 0%)",
					opacity: "var(--moon-o, 0)",
				}}
			/>

			{/* dim everything outside the viewport window */}
			<div className="absolute inset-0 overflow-hidden pointer-events-none">
				<div
					ref={(el) => {
						if (journey) journey.targets.mmDim = el;
					}}
					style={{
						...moverStyle,
						backgroundColor: "#020617",
						opacity: 0.4,
						maskImage: masks.dim,
						WebkitMaskImage: masks.dim,
					}}
				/>
			</div>

			{/* the indicator frame */}
			<div
				ref={(el) => {
					indicatorRef.current = el;
					if (journey) journey.targets.mmInd = el;
				}}
				className="absolute left-0 right-0 border-y-2 border-white/20 pointer-events-none"
				style={{
					top: 0,
					height: "var(--mm-h, 4%)",
					transform: "translateY(var(--mm-top-px, 0px))",
					willChange: "transform",
				}}
			/>
		</div>
	);
}

export const Minimap = memo(MinimapInner);
