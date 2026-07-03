import type React from "react";
import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { useCallback, useEffect, useRef } from "react";
import { useReducedMotion } from "./dive/useReducedMotion";

type BorderGlowOwnProps = {
	children?: ReactNode;
	className?: string;
	style?: React.CSSProperties;
	edgeSensitivity?: number;
	/* Minimum --edge-proximity (0-100) so the glow stays lit toward the card
	   center instead of only near the edges. 0 = faithful edge-only; higher =
	   responsive across the whole surface, still brightening toward the edge. */
	edgeFloor?: number;
	glowColor?: string;
	backgroundColor?: string;
	borderRadius?: number;
	glowRadius?: number;
	glowIntensity?: number;
	coneSpread?: number;
	animated?: boolean;
	colors?: string[];
	fillOpacity?: number;
};

type BorderGlowProps<C extends ElementType> = BorderGlowOwnProps & {
	as?: C;
} & Omit<ComponentPropsWithoutRef<C>, keyof BorderGlowOwnProps | "as">;

function parseHSL(hslStr: string): { h: number; s: number; l: number } {
	const match = hslStr.match(/([\d.]+)\s*([\d.]+)%?\s*([\d.]+)%?/);
	if (!match) return { h: 40, s: 80, l: 80 };
	const [, h = "40", s = "80", l = "80"] = match;
	return {
		h: Number.parseFloat(h),
		s: Number.parseFloat(s),
		l: Number.parseFloat(l),
	};
}

function buildGlowVars(
	glowColor: string,
	intensity: number,
): Record<string, string> {
	const { h, s, l } = parseHSL(glowColor);
	const base = `${h}deg ${s}% ${l}%`;
	const opacities = [100, 60, 50, 40, 30, 20, 10];
	const keys = ["", "-60", "-50", "-40", "-30", "-20", "-10"];
	const vars: Record<string, string> = {};
	opacities.forEach((opacity, i) => {
		vars[`--glow-color${keys[i]}`] =
			`hsl(${base} / ${Math.min(opacity * intensity, 100)}%)`;
	});
	return vars;
}

const GRADIENT_POSITIONS = [
	"80% 55%",
	"69% 34%",
	"8% 6%",
	"41% 38%",
	"86% 85%",
	"82% 18%",
	"51% 4%",
];
const GRADIENT_KEYS = [
	"--gradient-one",
	"--gradient-two",
	"--gradient-three",
	"--gradient-four",
	"--gradient-five",
	"--gradient-six",
	"--gradient-seven",
];
const GRADIENT_COLOR_INDICES = [0, 1, 2, 0, 1, 2, 1];

function buildGradientVars(colors: string[]): Record<string, string> {
	const vars: Record<string, string> = {};
	GRADIENT_KEYS.forEach((key, i) => {
		const c =
			colors[Math.min(GRADIENT_COLOR_INDICES[i] ?? 0, colors.length - 1)];
		vars[key] =
			`radial-gradient(at ${GRADIENT_POSITIONS[i]}, ${c} 0px, transparent 50%)`;
	});
	vars["--gradient-base"] = `linear-gradient(${colors[0]} 0 100%)`;
	return vars;
}

function easeOutCubic(x: number): number {
	return 1 - (1 - x) ** 3;
}
function easeInCubic(x: number): number {
	return x * x * x;
}

type AnimateValueOptions = {
	start?: number;
	end?: number;
	duration?: number;
	delay?: number;
	ease?: (x: number) => number;
	onUpdate: (v: number) => void;
	onEnd?: () => void;
};

function animateValue({
	start = 0,
	end = 100,
	duration = 1000,
	delay = 0,
	ease = easeOutCubic,
	onUpdate,
	onEnd,
}: AnimateValueOptions): () => void {
	let raf = 0;
	const t0 = performance.now() + delay;
	function tick() {
		const elapsed = performance.now() - t0;
		const t = Math.min(elapsed / duration, 1);
		onUpdate(start + (end - start) * ease(t));
		if (t < 1) raf = requestAnimationFrame(tick);
		else if (onEnd) onEnd();
	}
	const timeout = setTimeout(() => {
		raf = requestAnimationFrame(tick);
	}, delay);
	return () => {
		clearTimeout(timeout);
		cancelAnimationFrame(raf);
	};
}

export function BorderGlow<C extends ElementType = "div">({
	as,
	children,
	className = "",
	style,
	edgeSensitivity = 30,
	edgeFloor = 0,
	glowColor = "40 80 80",
	backgroundColor = "#120F17",
	borderRadius = 28,
	glowRadius = 40,
	glowIntensity = 1.0,
	coneSpread = 25,
	animated = false,
	colors = ["#c084fc", "#f472b6", "#38bdf8"],
	fillOpacity = 0.5,
	...rest
}: BorderGlowProps<C>) {
	const Root = (as ?? "div") as ElementType;
	const cardRef = useRef<HTMLElement>(null);
	const reducedMotion = useReducedMotion();

	const handlePointerMove = useCallback(
		(e: React.PointerEvent<HTMLElement>) => {
			if (e.pointerType === "touch") return;
			const card = cardRef.current;
			if (!card) return;

			const rect = card.getBoundingClientRect();
			const x = e.clientX - rect.left;
			const y = e.clientY - rect.top;
			const cx = rect.width / 2;
			const cy = rect.height / 2;
			const dx = x - cx;
			const dy = y - cy;
			let kx = Infinity;
			let ky = Infinity;
			if (dx !== 0) kx = cx / Math.abs(dx);
			if (dy !== 0) ky = cy / Math.abs(dy);
			const edge = Math.min(Math.max(1 / Math.min(kx, ky), 0), 1);
			let angle: number;
			if (dx === 0 && dy === 0) {
				angle = 0;
			} else {
				angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
				if (angle < 0) angle += 360;
			}

			const proximity = edgeFloor + edge * (100 - edgeFloor);
			card.style.setProperty("--edge-proximity", proximity.toFixed(3));
			card.style.setProperty("--cursor-angle", `${angle.toFixed(3)}deg`);
		},
		[edgeFloor],
	);

	// Exposed-but-site-unused intro sweep, kept faithful to the React Bits source.
	// Reduced-motion-gated (early return) and cleaned up: every scheduled timer/rAF
	// is cancelled and `sweep-active` stripped when deps change or the card unmounts.
	useEffect(() => {
		if (!animated || reducedMotion || !cardRef.current) return;
		const card = cardRef.current;
		const angleStart = 110;
		const angleEnd = 465;
		card.classList.add("sweep-active");
		card.style.setProperty("--cursor-angle", `${angleStart}deg`);

		const cancels = [
			animateValue({
				duration: 500,
				onUpdate: (v) => card.style.setProperty("--edge-proximity", String(v)),
			}),
			animateValue({
				ease: easeInCubic,
				duration: 1500,
				end: 50,
				onUpdate: (v) => {
					card.style.setProperty(
						"--cursor-angle",
						`${(angleEnd - angleStart) * (v / 100) + angleStart}deg`,
					);
				},
			}),
			animateValue({
				ease: easeOutCubic,
				delay: 1500,
				duration: 2250,
				start: 50,
				end: 100,
				onUpdate: (v) => {
					card.style.setProperty(
						"--cursor-angle",
						`${(angleEnd - angleStart) * (v / 100) + angleStart}deg`,
					);
				},
			}),
			animateValue({
				ease: easeInCubic,
				delay: 2500,
				duration: 1500,
				start: 100,
				end: 0,
				onUpdate: (v) => card.style.setProperty("--edge-proximity", String(v)),
				onEnd: () => card.classList.remove("sweep-active"),
			}),
		];

		return () => {
			for (const cancel of cancels) cancel();
			card.classList.remove("sweep-active");
		};
	}, [animated, reducedMotion]);

	const glowVars = buildGlowVars(glowColor, glowIntensity);

	return (
		<Root
			{...rest}
			ref={cardRef as React.Ref<HTMLElement>}
			onPointerMove={handlePointerMove}
			className={`border-glow-card ${className}`}
			style={
				{
					"--card-bg": backgroundColor,
					"--edge-sensitivity": edgeSensitivity,
					"--border-radius": `${borderRadius}px`,
					"--glow-padding": `${glowRadius}px`,
					"--cone-spread": coneSpread,
					"--fill-opacity": fillOpacity,
					...glowVars,
					...buildGradientVars(colors),
					...style,
				} as React.CSSProperties
			}
		>
			<span className="edge-light" aria-hidden="true" />
			<div className="border-glow-inner">{children}</div>
		</Root>
	);
}
