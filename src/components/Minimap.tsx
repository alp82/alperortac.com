import { useEffect, useMemo, useRef, useState } from "react";
import type { CelestialState } from "../data/celestial";
import { skyAt } from "../data/skyCurve";
import {
	celestialPosition,
	moonOpacityAt,
	MOON_WINDOW,
	sunOpacityAt,
	SUN_WINDOW,
	windowedProgress,
} from "./minimap/helpers";

// Distance (% of minimap container height) over which the live-color band
// fades into the surrounding sky-snapshot gradient at its top and bottom
// edges. Tuned in the (now-deleted) /minimap-lab — ease-in-out at 20 lands
// the smoothest seam against the page sky.
const TRANSITION_DISTANCE = 20;

// Returns the inner ease-in-out stops of a fade region. Endpoints are emitted
// by the caller. Empty when the region collapses to zero width.
function fadeStops(
	startPct: number,
	endPct: number,
	fadingToTransparent: boolean,
): string {
	const D = endPct - startPct;
	if (D <= 0) return "";
	const a1 = fadingToTransparent ? 0.8 : 0.2;
	const a2 = fadingToTransparent ? 0.2 : 0.8;
	return `rgba(0,0,0,${a1}) ${(startPct + D * 0.3).toFixed(2)}%, rgba(0,0,0,${a2}) ${(startPct + D * 0.7).toFixed(2)}%`;
}

function buildDimMask(vpTopPct: number, vpHeightPct: number): string {
	const A1 = Math.max(0, vpTopPct - TRANSITION_DISTANCE);
	const B1 = vpTopPct;
	const A2 = vpTopPct + vpHeightPct;
	const B2 = Math.min(100, vpTopPct + vpHeightPct + TRANSITION_DISTANCE);
	const topInner = fadeStops(A1, B1, true);
	const botInner = fadeStops(A2, B2, false);
	const stops = [
		"black 0%",
		`black ${A1.toFixed(2)}%`,
		...(topInner ? [topInner] : []),
		`transparent ${B1.toFixed(2)}%`,
		`transparent ${A2.toFixed(2)}%`,
		...(botInner ? [botInner] : []),
		`black ${B2.toFixed(2)}%`,
		"black 100%",
	];
	return `linear-gradient(to bottom, ${stops.join(", ")})`;
}

function buildBandMask(vpTopPct: number, vpHeightPct: number): string {
	const A1 = Math.max(0, vpTopPct - TRANSITION_DISTANCE);
	const B1 = vpTopPct;
	const A2 = vpTopPct + vpHeightPct;
	const B2 = Math.min(100, vpTopPct + vpHeightPct + TRANSITION_DISTANCE);
	const topInner = fadeStops(A1, B1, false);
	const botInner = fadeStops(A2, B2, true);
	const stops = [
		"transparent 0%",
		`transparent ${A1.toFixed(2)}%`,
		...(topInner ? [topInner] : []),
		`black ${B1.toFixed(2)}%`,
		`black ${A2.toFixed(2)}%`,
		...(botInner ? [botInner] : []),
		`transparent ${B2.toFixed(2)}%`,
		"transparent 100%",
	];
	return `linear-gradient(to bottom, ${stops.join(", ")})`;
}

type MinimapProps = {
	scrollProgress: number;
	celestial: CelestialState;
};

export function Minimap({ scrollProgress, celestial }: MinimapProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [viewportRatio, setViewportRatio] = useState(0);
	const isDraggingRef = useRef(false);

	useEffect(() => {
		const measure = () => {
			const docHeight = document.documentElement.scrollHeight;
			const winHeight = window.innerHeight;
			setViewportRatio(winHeight / docHeight);
		};

		measure();
		const raf = requestAnimationFrame(measure);
		window.addEventListener("resize", measure);
		return () => {
			cancelAnimationFrame(raf);
			window.removeEventListener("resize", measure);
		};
	}, []);

	const scrollToY = (clientY: number) => {
		const el = containerRef.current;
		if (!el) return;
		const rect = el.getBoundingClientRect();
		const ratio = Math.min(Math.max((clientY - rect.top) / rect.height, 0), 1);
		const target =
			ratio * (document.documentElement.scrollHeight - window.innerHeight);
		window.scrollTo({ top: target, behavior: "instant" as ScrollBehavior });
	};

	const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
		isDraggingRef.current = true;
		e.currentTarget.setPointerCapture(e.pointerId);
		scrollToY(e.clientY);
	};

	const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
		if (!isDraggingRef.current) return;
		scrollToY(e.clientY);
	};

	const stopDrag = (e: React.PointerEvent<HTMLDivElement>) => {
		isDraggingRef.current = false;
		if (e.currentTarget.hasPointerCapture(e.pointerId)) {
			e.currentTarget.releasePointerCapture(e.pointerId);
		}
	};

	const viewportTopPct = scrollProgress * (1 - viewportRatio) * 100;
	const viewportHeightPct = Math.max(viewportRatio * 100, 4);

	const minimapGradient = useMemo(() => {
		const STOPS = 48;
		const parts: string[] = [];
		for (let i = 0; i < STOPS; i++) {
			const p = i / (STOPS - 1);
			parts.push(`${skyAt(p, celestial.curve)} ${(p * 100).toFixed(2)}%`);
		}
		return `linear-gradient(to bottom, ${parts.join(", ")})`;
	}, [celestial.curve]);

	const sunSkyY = celestialPosition(
		windowedProgress(scrollProgress, SUN_WINDOW),
		celestial.sun,
	).y;
	const moonSkyY = celestialPosition(
		windowedProgress(scrollProgress, MOON_WINDOW),
		celestial.moon,
	).y;
	const sunY = viewportTopPct + (sunSkyY / 100) * viewportHeightPct;
	const moonY = viewportTopPct + (moonSkyY / 100) * viewportHeightPct;
	const sunOpacity = sunOpacityAt(scrollProgress);
	const moonOpacity = moonOpacityAt(scrollProgress);

	const dimMask = buildDimMask(viewportTopPct, viewportHeightPct);
	const bandMask = buildBandMask(viewportTopPct, viewportHeightPct);
	const bandColor = skyAt(scrollProgress, celestial.curve);

	return (
		<div
			ref={containerRef}
			onPointerDown={handlePointerDown}
			onPointerMove={handlePointerMove}
			onPointerUp={stopDrag}
			onPointerCancel={stopDrag}
			role="presentation"
			aria-hidden="true"
			className="hidden md:block fixed right-0 top-0 w-20 h-screen border-l-2 border-slate-900 cursor-pointer select-none z-40 overflow-hidden touch-none"
			style={{
				background: minimapGradient,
				willChange: "transform",
			}}
		>
			<div
				className="absolute inset-0 pointer-events-none"
				style={{
					backgroundColor: bandColor,
					maskImage: bandMask,
					WebkitMaskImage: bandMask,
				}}
			/>
			<div
				className="absolute -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-yellow-200 border border-yellow-400 shadow-[0_0_6px_rgba(253,224,71,0.7)] pointer-events-none"
				style={{
					left: "50%",
					top: `${sunY}%`,
					opacity: sunOpacity,
				}}
			/>
			<div
				className="absolute -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-slate-100 border border-slate-300 pointer-events-none"
				style={{
					left: "50%",
					top: `${moonY}%`,
					opacity: moonOpacity,
				}}
			/>
			<div
				className="absolute inset-0 pointer-events-none bg-slate-950"
				style={{
					opacity: 0.4,
					maskImage: dimMask,
					WebkitMaskImage: dimMask,
				}}
			/>
			<div
				className="absolute left-0 right-0 border-y-2 border-slate-900 pointer-events-none"
				style={{
					top: `${viewportTopPct}%`,
					height: `${viewportHeightPct}%`,
				}}
			/>
		</div>
	);
}
