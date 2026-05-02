import { useCallback, useEffect, useRef, useState } from "react";
import { usePostHog } from "@posthog/react";
import { sampleClearedPct } from "../lib/digSampler";
import { Placeholder } from "./Placeholder";

const SOIL_COLOR = "#5a3a22";
const SOIL_RIM = "#2f1c0e";
const REVEAL_THRESHOLD = 0.25;

type Size = { width: number; height: number; brushRadius: number };

function pickSize(): Size {
	if (typeof window === "undefined") {
		return { width: 1024, height: 720, brushRadius: 56 };
	}
	const width = window.innerWidth;
	const height = window.innerHeight;
	const brushRadius = Math.max(
		42,
		Math.min(72, Math.round(Math.min(width, height) * 0.06)),
	);
	return { width, height, brushRadius };
}

function paintSoil(ctx: CanvasRenderingContext2D, w: number, h: number): void {
	ctx.globalCompositeOperation = "source-over";

	// Layered soil: a vertical gradient so the top blends with the forest
	// floor's lower edge and the bottom darkens into deep earth.
	const grad = ctx.createLinearGradient(0, 0, 0, h);
	grad.addColorStop(0, "#6a4a32");
	grad.addColorStop(0.4, SOIL_COLOR);
	grad.addColorStop(1, SOIL_RIM);
	ctx.fillStyle = grad;
	ctx.fillRect(0, 0, w, h);

	// Speckles for texture. Deterministic — keeps repaint stable on resize.
	ctx.fillStyle = SOIL_RIM;
	const speckles = Math.round((w * h) / 5000);
	for (let i = 0; i < speckles; i++) {
		const x = (i * 9973) % w;
		const y = (i * 6577) % h;
		const r = ((i % 4) + 1) * 1.1;
		ctx.beginPath();
		ctx.arc(x, y, r, 0, Math.PI * 2);
		ctx.fill();
	}

	// Lighter pebble flecks for a richer surface.
	ctx.fillStyle = "rgba(255, 220, 180, 0.18)";
	const flecks = Math.round((w * h) / 12000);
	for (let i = 0; i < flecks; i++) {
		const x = (i * 7919) % w;
		const y = (i * 4001) % h;
		const r = ((i % 3) + 1) * 0.9;
		ctx.beginPath();
		ctx.arc(x, y, r, 0, Math.PI * 2);
		ctx.fill();
	}
}

type Particle = { id: number; x: number; y: number; dx: number; dy: number };

const PARTICLE_TTL_MS = 700;
const PARTICLE_SPAWN_MIN_MS = 35;

/**
 * Drag-to-clear soil patch, full section coverage.
 *
 * The canvas now spans the entire section. Clearing 25% reveals the
 * placeholder beneath. While dragging the user gets:
 *   - dust particles spawned at pointer position
 *   - light haptic vibration (touch devices)
 *   - a "drag to dig" hint that fades on first stroke
 */
export function DigZone(): React.ReactElement {
	const posthog = usePostHog();
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const containerRef = useRef<HTMLDivElement | null>(null);
	const drawingRef = useRef(false);
	const lastPointRef = useRef<{ x: number; y: number } | null>(null);
	const sampleTickRef = useRef(0);
	const sizeRef = useRef<Size>(pickSize());
	const lastVibrateRef = useRef(0);
	const lastParticleRef = useRef(0);
	const particleIdRef = useRef(0);
	const [revealed, setRevealed] = useState(false);
	const [started, setStarted] = useState(false);
	const [particles, setParticles] = useState<ReadonlyArray<Particle>>([]);
	const revealedRef = useRef(false);
	const startedRef = useRef(false);

	const sampleAndMaybeReveal = useCallback(() => {
		if (revealedRef.current) return;
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d", { willReadFrequently: true });
		if (!ctx) return;
		const pct = sampleClearedPct(ctx, canvas.width, canvas.height, 12);
		if (pct >= REVEAL_THRESHOLD) {
			revealedRef.current = true;
			setRevealed(true);
			posthog.capture("dig_revealed", {
				method: "drag",
				cleared_pct: Math.round(pct * 100),
			});
		}
	}, [posthog]);

	const spawnParticles = useCallback((x: number, y: number) => {
		const now = performance.now();
		if (now - lastParticleRef.current < PARTICLE_SPAWN_MIN_MS) return;
		lastParticleRef.current = now;

		const fresh: Particle[] = [];
		const count = 2 + Math.floor(Math.random() * 2);
		for (let i = 0; i < count; i++) {
			const angle = Math.random() * Math.PI * 2;
			const dist = 24 + Math.random() * 38;
			fresh.push({
				id: particleIdRef.current++,
				x,
				y,
				dx: Math.cos(angle) * dist,
				dy: Math.sin(angle) * dist - 12, // slight upward bias for "kicked up" feel
			});
		}
		setParticles((prev) => [...prev, ...fresh]);
		const ids = fresh.map((p) => p.id);
		window.setTimeout(() => {
			setParticles((prev) => prev.filter((p) => !ids.includes(p.id)));
		}, PARTICLE_TTL_MS);
	}, []);

	const maybeVibrate = useCallback(() => {
		if (typeof navigator === "undefined" || !navigator.vibrate) return;
		const now = performance.now();
		if (now - lastVibrateRef.current < 90) return;
		lastVibrateRef.current = now;
		navigator.vibrate(8);
	}, []);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const apply = (size: Size) => {
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
			startedRef.current = false;
			setRevealed(false);
			setStarted(false);
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
			ctx.beginPath();
			ctx.arc(to.x, to.y, radius, 0, Math.PI * 2);
			ctx.fill();
			if (from) {
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

	const containerPoint = useCallback(
		(e: React.PointerEvent<HTMLCanvasElement>) => {
			const container = containerRef.current;
			if (!container) return null;
			const rect = container.getBoundingClientRect();
			return {
				x: e.clientX - rect.left,
				y: e.clientY - rect.top,
			};
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
			if (!startedRef.current) {
				startedRef.current = true;
				setStarted(true);
				posthog.capture("dig_started", {
					pointer_type: e.pointerType,
				});
			}
			const cp = containerPoint(e);
			if (cp) spawnParticles(cp.x, cp.y);
			maybeVibrate();
			sampleAndMaybeReveal();
		},
		[
			containerPoint,
			erase,
			localPoint,
			maybeVibrate,
			posthog,
			sampleAndMaybeReveal,
			spawnParticles,
		],
	);

	const onPointerMove = useCallback(
		(e: React.PointerEvent<HTMLCanvasElement>) => {
			if (!drawingRef.current) return;
			e.preventDefault();
			const point = localPoint(e);
			if (!point) return;
			erase(lastPointRef.current, point);
			lastPointRef.current = point;
			const cp = containerPoint(e);
			if (cp) spawnParticles(cp.x, cp.y);
			maybeVibrate();
			sampleTickRef.current = (sampleTickRef.current + 1) % 6;
			if (sampleTickRef.current === 0) {
				window.requestAnimationFrame(sampleAndMaybeReveal);
			}
		},
		[
			containerPoint,
			erase,
			localPoint,
			maybeVibrate,
			sampleAndMaybeReveal,
			spawnParticles,
		],
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

	const onKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLCanvasElement>) => {
			if (revealedRef.current) return;
			if (e.key === " " || e.key === "Enter") {
				e.preventDefault();
				revealedRef.current = true;
				setRevealed(true);
				posthog.capture("dig_revealed_keyboard", {
					key: e.key,
				});
			}
		},
		[posthog],
	);

	return (
		<div
			ref={containerRef}
			className="absolute inset-0 z-20 overflow-hidden"
			style={{
				background:
					"linear-gradient(to bottom, #5a3a22 0%, #3d2616 35%, #1a0e07 100%)",
			}}
		>
			<Placeholder revealed={revealed} />
			<canvas
				ref={canvasRef}
				tabIndex={0}
				className="dig-canvas absolute inset-0 h-full w-full"
				aria-label="Drag to clear the soil and reveal what's underneath. Press Space or Enter to reveal."
				onPointerDown={onPointerDown}
				onPointerMove={onPointerMove}
				onPointerUp={stopDrawing}
				onPointerCancel={stopDrawing}
				onPointerLeave={stopDrawing}
				onKeyDown={onKeyDown}
			/>
			<div
				className="dig-hint absolute inset-0 flex flex-col items-center justify-center gap-3"
				data-dimmed={started ? "true" : "false"}
			>
				<div className="dig-pulse rounded-full bg-black/30 px-5 py-2 text-base font-semibold text-[color:var(--text-on-dark)] backdrop-blur-sm sm:text-lg">
					Drag anywhere to dig
				</div>
				<div className="relative h-6 w-44 overflow-hidden">
					<div className="dig-arrow-sweep absolute inset-y-0 flex items-center gap-1 text-[color:var(--text-on-dark)]/80">
						<span className="block h-[2px] w-6 bg-current" />
						<span className="block h-[2px] w-10 bg-current" />
						<span className="block h-[2px] w-6 bg-current" />
					</div>
				</div>
			</div>
			{particles.map((p) => (
				<span
					key={p.id}
					className="dig-particle"
					style={
						{
							left: `${p.x}px`,
							top: `${p.y}px`,
							"--dx": `${p.dx}px`,
							"--dy": `${p.dy}px`,
						} as React.CSSProperties
					}
				/>
			))}
		</div>
	);
}
