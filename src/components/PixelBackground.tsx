import { useMemo } from "react";
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

function Stars({
	scrollProgress,
	curve,
}: {
	scrollProgress: number;
	curve: CelestialState["curve"];
}) {
	const stars = useMemo(() => {
		return Array.from({ length: 150 }).map((_, i) => ({
			id: i,
			x: Math.random() * 100,
			y: Math.random() * 100,
			size: Math.random() * 2.5 + 0.5,
			delay: Math.random() * 5,
			duration: Math.random() * 3 + 2,
		}));
	}, []);

	const shootingStars = useMemo(() => {
		return Array.from({ length: 6 }).map((_, i) => ({
			id: i,
			top: Math.random() * 40,
			delay: Math.random() * 12 + i * 4,
		}));
	}, []);

	// Dots fade in across the phase2 (dusk -> night) window.
	const [s2, e2] = curve.phase2;
	const dotsRange = Math.max(e2 - s2, 0.001);
	const dotsOpacity = Math.min(
		1,
		Math.max(0, (scrollProgress - s2) / dotsRange),
	);

	// Shooting-star lines only kick in once the sky is close to deep night —
	// ramps slowly from phase2 end to the bottom of the page.
	const shootingRange = Math.max(1 - e2, 0.001);
	const shootingOpacity = Math.min(
		1,
		Math.max(0, (scrollProgress - e2) / shootingRange),
	);

	return (
		<div className="absolute inset-0 overflow-hidden pointer-events-none">
			<div
				className="absolute inset-0 transition-opacity duration-100 ease-linear"
				style={{ opacity: dotsOpacity }}
			>
				{stars.map((star) => (
					<div
						key={star.id}
						className="absolute bg-white rounded-full animate-twinkle"
						style={{
							left: `${star.x}%`,
							top: `${star.y}%`,
							width: `${star.size}px`,
							height: `${star.size}px`,
							animationDelay: `${star.delay}s`,
							animationDuration: `${star.duration}s`,
							boxShadow: `0 0 ${star.size * 2}px rgba(255, 255, 255, 0.6)`,
						}}
					/>
				))}
			</div>
			<div
				className="absolute inset-0 transition-opacity duration-100 ease-linear"
				style={{ opacity: shootingOpacity }}
			>
				{shootingStars.map((star) => (
					<div
						key={`shoot-${star.id}`}
						className="absolute h-[1px] bg-gradient-to-r from-transparent via-white to-white animate-shooting-star"
						style={{
							top: `${star.top}%`,
							left: "100%",
							width: "120px",
							animationDelay: `${star.delay}s`,
							transform: "rotate(-35deg)",
						}}
					/>
				))}
			</div>
		</div>
	);
}

type PixelCloudProps = {
	x: number;
	y: number;
	scale: number;
	speed: number;
	scrollPos: number;
};

function PixelCloud({ x, y, scale, speed, scrollPos }: PixelCloudProps) {
	const transform = `translate(${x + scrollPos * speed}px, ${y}px) scale(${scale})`;
	return (
		<svg
			viewBox="0 0 100 60"
			className="absolute opacity-40 select-none pointer-events-none"
			style={{
				width: "120px",
				height: "auto",
				left: 0,
				top: 0,
				transform,
				transition: "transform 0.1s linear",
			}}
			aria-hidden="true"
		>
			<path
				fill="white"
				d="M20 30h10v10H20zM30 20h40v10H30zM70 30h10v10H70zM10 40h80v10H10z"
			/>
		</svg>
	);
}

export function PixelBackground({
	scrollProgress,
	celestial,
}: {
	scrollProgress: number;
	celestial: CelestialState;
}) {
	const skyColor = skyAt(scrollProgress, celestial.curve);

	return (
		<div
			className="fixed inset-y-0 left-0 right-0 md:right-20 -z-10 transition-colors duration-100 ease-linear"
			style={{ backgroundColor: skyColor }}
		>
			<Stars scrollProgress={scrollProgress} curve={celestial.curve} />

			{(() => {
				const sunPos = celestialPosition(
					windowedProgress(scrollProgress, SUN_WINDOW),
					celestial.sun,
				);
				const sunOpacity = sunOpacityAt(scrollProgress);
				return (
					<div
						className="absolute"
						style={{
							left: `${sunPos.x}%`,
							top: `${sunPos.y}%`,
							transform: "translate(-50%, -50%)",
							opacity: sunOpacity,
							transition: "opacity 100ms linear",
						}}
					>
						<div className="w-24 h-24 bg-yellow-200 rounded-full shadow-[0_0_40px_rgba(253,224,71,0.5)] border-4 border-yellow-300" />
					</div>
				);
			})()}

			{(() => {
				const moonPos = celestialPosition(
					windowedProgress(scrollProgress, MOON_WINDOW),
					celestial.moon,
				);
				const moonOpacity = moonOpacityAt(scrollProgress);
				return (
					<div
						className="absolute"
						style={{
							left: `${moonPos.x}%`,
							top: `${moonPos.y}%`,
							transform: "translate(-50%, -50%)",
							opacity: moonOpacity,
							transition: "opacity 100ms linear",
						}}
					>
						<div className="w-20 h-20 bg-slate-100 rounded-full shadow-[0_0_60px_rgba(255,255,255,0.2)] border-4 border-slate-300 flex items-center justify-center overflow-hidden">
							<div className="w-6 h-6 rounded-full bg-slate-200 absolute top-2 right-4 opacity-60" />
							<div className="w-8 h-8 rounded-full bg-slate-200 absolute bottom-4 left-2 opacity-40" />
							<div className="w-4 h-4 rounded-full bg-slate-200 absolute top-8 left-8 opacity-50" />
						</div>
					</div>
				);
			})()}

			<PixelCloud
				x={100}
				y={150}
				scale={1.2}
				speed={0.05}
				scrollPos={scrollProgress * 1000}
			/>
			<PixelCloud
				x={600}
				y={100}
				scale={0.8}
				speed={-0.08}
				scrollPos={scrollProgress * 1000}
			/>
			<PixelCloud
				x={1000}
				y={250}
				scale={1}
				speed={0.03}
				scrollPos={scrollProgress * 1000}
			/>

			<div
				className="absolute bottom-0 w-full h-[40vh] pointer-events-none transition-opacity duration-100 ease-linear"
				style={{ opacity: Math.max(0.1, 0.4 - scrollProgress * 0.2) }}
			>
				<svg
					viewBox="0 0 1000 400"
					preserveAspectRatio="none"
					className="w-full h-full opacity-30"
					aria-hidden="true"
				>
					<path
						fill="#4a7a8c"
						d="M0 400V300l100-50h50l100 100h50l150-150h50l100 80h100l200-180h100v300z"
						style={{ shapeRendering: "crispEdges" }}
					/>
				</svg>
			</div>

			<div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
		</div>
	);
}
