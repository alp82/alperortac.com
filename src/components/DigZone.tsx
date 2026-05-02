import { useCallback, useEffect, useRef, useState } from "react";
import { sampleClearedPct } from "../lib/digSampler";
import { Placeholder } from "./Placeholder";

const SOIL_COLOR = "#5a3a22";
const SOIL_RIM = "#2f1c0e";
const REVEAL_THRESHOLD = 0.5;

type Size = { width: number; height: number; brushRadius: number };

function pickSize(): Size {
	if (typeof window === "undefined") {
		return { width: 400, height: 260, brushRadius: 28 };
	}
	const isMobile = window.innerWidth < 640;
	if (isMobile) {
		const width = Math.min(
			Math.round(window.innerWidth * 0.8),
			window.innerWidth - 32,
		);
		return { width, height: 240, brushRadius: 36 };
	}
	return { width: 400, height: 260, brushRadius: 28 };
}

function paintSoil(ctx: CanvasRenderingContext2D, w: number, h: number): void {
	ctx.globalCompositeOperation = "source-over";
	ctx.fillStyle = SOIL_COLOR;
	ctx.fillRect(0, 0, w, h);

	// A few darker speckles for visual interest. Deterministic so SSR
	// hydration of any wrapper text won't drift; the canvas itself is
	// painted purely client-side.
	ctx.fillStyle = SOIL_RIM;
	const speckles = 36;
	for (let i = 0; i < speckles; i++) {
		const x = ((i * 73) % w) | 0;
		const y = ((i * 131) % h) | 0;
		const r = ((i % 4) + 1) * 0.9;
		ctx.beginPath();
		ctx.arc(x, y, r, 0, Math.PI * 2);
		ctx.fill();
	}
}

/**
 * Drag-to-clear soil patch. Lives in the last viewport, layered above
 * a `<Placeholder />` that fades in once the user has cleared more
 * than half the patch.
 *
 * Touch parity: `touch-action: none` on the canvas (via CSS) plus
 * `e.preventDefault()` on pointer-move events keeps the browser from
 * interpreting the drag as a page scroll.
 */
export function DigZone(): React.ReactElement {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const containerRef = useRef<HTMLDivElement | null>(null);
	const drawingRef = useRef(false);
	const lastPointRef = useRef<{ x: number; y: number } | null>(null);
	const sampleTickRef = useRef(0);
	const sizeRef = useRef<Size>(pickSize());
	const [revealed, setRevealed] = useState(false);
	const revealedRef = useRef(false);

	const sampleAndMaybeReveal = useCallback(() => {
		if (revealedRef.current) return;
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d", { willReadFrequently: true });
		if (!ctx) return;
		const pct = sampleClearedPct(ctx, canvas.width, canvas.height, 8);
		if (pct >= REVEAL_THRESHOLD) {
			revealedRef.current = true;
			setRevealed(true);
		}
	}, []);

	// Initial paint and resize handling.
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const apply = (size: Size) => {
			// Reset any in-flight drag state: resizing reallocates the canvas
			// backing buffer, so a stale `lastPoint` from the prior dimensions
			// would smear an erase stroke across the new buffer.
			drawingRef.current = false;
			lastPointRef.current = null;
			canvas.width = size.width;
			canvas.height = size.height;
			canvas.style.width = `${size.width}px`;
			canvas.style.height = `${size.height}px`;
			const ctx = canvas.getContext("2d");
			if (!ctx) return;
			paintSoil(ctx, size.width, size.height);
			sizeRef.current = size;
			revealedRef.current = false;
			setRevealed(false);
		};

		apply(pickSize());

		const onResize = () => {
			const next = pickSize();
			if (
				next.width !== sizeRef.current.width ||
				next.height !== sizeRef.current.height
			) {
				apply(next);
			}
		};
		window.addEventListener("resize", onResize);
		return () => {
			window.removeEventListener("resize", onResize);
		};
	}, []);

	const localPoint = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
		const canvas = canvasRef.current;
		if (!canvas) return null;
		const rect = canvas.getBoundingClientRect();
		const scaleX = canvas.width / rect.width;
		const scaleY = canvas.height / rect.height;
		return {
			x: (e.clientX - rect.left) * scaleX,
			y: (e.clientY - rect.top) * scaleY,
		};
	}, []);

	const erase = useCallback(
		(from: { x: number; y: number } | null, to: { x: number; y: number }) => {
			const canvas = canvasRef.current;
			if (!canvas) return;
			const ctx = canvas.getContext("2d");
			if (!ctx) return;
			const radius = sizeRef.current.brushRadius;
			ctx.globalCompositeOperation = "destination-out";
			ctx.fillStyle = "rgba(0,0,0,1)";
			// Stamp at `to`.
			ctx.beginPath();
			ctx.arc(to.x, to.y, radius, 0, Math.PI * 2);
			ctx.fill();
			if (from) {
				// Stamp along the segment for smoother strokes on fast moves.
				const dx = to.x - from.x;
				const dy = to.y - from.y;
				const dist = Math.hypot(dx, dy);
				const steps = Math.max(1, Math.floor(dist / (radius * 0.5)));
				for (let i = 1; i < steps; i++) {
					const t = i / steps;
					ctx.beginPath();
					ctx.arc(from.x + dx * t, from.y + dy * t, radius, 0, Math.PI * 2);
					ctx.fill();
				}
			}
		},
		[],
	);

	const onPointerDown = useCallback(
		(e: React.PointerEvent<HTMLCanvasElement>) => {
			if (revealedRef.current) return;
			const point = localPoint(e);
			if (!point) return;
			drawingRef.current = true;
			lastPointRef.current = point;
			sampleTickRef.current = 0;
			(e.target as HTMLCanvasElement).setPointerCapture?.(e.pointerId);
			erase(null, point);
			sampleAndMaybeReveal();
		},
		[erase, localPoint, sampleAndMaybeReveal],
	);

	const onPointerMove = useCallback(
		(e: React.PointerEvent<HTMLCanvasElement>) => {
			if (!drawingRef.current) return;
			e.preventDefault();
			const point = localPoint(e);
			if (!point) return;
			erase(lastPointRef.current, point);
			lastPointRef.current = point;
			sampleTickRef.current = (sampleTickRef.current + 1) % 8;
			if (sampleTickRef.current === 0) {
				window.requestAnimationFrame(sampleAndMaybeReveal);
			}
		},
		[erase, localPoint, sampleAndMaybeReveal],
	);

	const stopDrawing = useCallback(
		(e: React.PointerEvent<HTMLCanvasElement>) => {
			if (!drawingRef.current) return;
			drawingRef.current = false;
			lastPointRef.current = null;
			(e.target as HTMLCanvasElement).releasePointerCapture?.(e.pointerId);
			sampleAndMaybeReveal();
		},
		[sampleAndMaybeReveal],
	);

	const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLCanvasElement>) => {
		if (revealedRef.current) return;
		if (e.key === " " || e.key === "Enter") {
			e.preventDefault();
			revealedRef.current = true;
			setRevealed(true);
		}
	}, []);

	return (
		<div
			ref={containerRef}
			className="relative z-20 mx-auto flex h-[240px] w-[80vw] max-w-[400px] items-center justify-center sm:h-[260px] sm:w-[400px]"
		>
			<Placeholder revealed={revealed} />
			<canvas
				ref={canvasRef}
				tabIndex={0}
				className="dig-canvas absolute inset-0 m-auto"
				aria-label="Drag to clear the soil and reveal what's underneath. Press Space or Enter to reveal."
				onPointerDown={onPointerDown}
				onPointerMove={onPointerMove}
				onPointerUp={stopDrawing}
				onPointerCancel={stopDrawing}
				onPointerLeave={stopDrawing}
				onKeyDown={onKeyDown}
			/>
		</div>
	);
}
