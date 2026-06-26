import { useMemo, useRef } from "react";
import type { CelestialState } from "../data/celestial";
import { skyAt } from "../data/skyCurve";
import type { DiveRenderState } from "./_layout/dive/diveConstants";
import { useHandheldJitter } from "./_layout/dive/useHandheldJitter";
import {
	celestialPosition,
	MOON_WINDOW,
	moonOpacityAt,
	SUN_WINDOW,
	sunOpacityAt,
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
	dive,
}: {
	scrollProgress: number;
	celestial: CelestialState;
	dive?: DiveRenderState | undefined;
}) {
	const skyColor = skyAt(scrollProgress, celestial.curve);
	const sceneRef = useRef<HTMLDivElement>(null);

	// rAF colocated with the scene element it writes to: the handheld technique's
	// faint jitter runs only while a handheld dive is at depth (dive.u === 1).
	useHandheldJitter({
		sceneRef,
		active: dive?.technique === "handheld" && dive.u === 1,
	});

	const sceneStyle = dive
		? ({
				"--dive-u": dive.u,
				"--dive-origin": dive.origin,
				"--dive-blur-strength": dive.blurStrength,
				"--dive-focal-depth": dive.focalDepth,
			} as React.CSSProperties)
		: undefined;

	return (
		<div className="dive-viewport fixed inset-y-0 left-0 right-0 md:right-20 -z-10">
			{/* Opt-in fisheye filter for the lens-warp technique. techniqueFor never
			    auto-selects lens-warp, so this stays OFF for every adaptive dive — it
			    only engages if data-technique="lens-warp" is set explicitly. */}
			<svg width="0" height="0" className="absolute" aria-hidden="true">
				<defs>
					<filter
						id="diveLensWarp"
						x="-20%"
						y="-20%"
						width="140%"
						height="140%"
					>
						<feTurbulence
							type="fractalNoise"
							baseFrequency="0.012 0.012"
							numOctaves={2}
							seed={7}
							result="diveLensNoise"
						/>
						<feDisplacementMap
							in="SourceGraphic"
							in2="diveLensNoise"
							scale={6}
							xChannelSelector="R"
							yChannelSelector="G"
						/>
					</filter>
				</defs>
			</svg>
			<div
				ref={sceneRef}
				className="dive-scene absolute inset-0"
				style={sceneStyle}
				{...(dive ? { "data-technique": dive.technique } : {})}
			>
				<div
					className="dive-layer absolute inset-0 transition-colors duration-100 ease-linear"
					data-depth="0"
					style={
						{
							backgroundColor: skyColor,
							"--layer-depth": 0,
						} as React.CSSProperties
					}
				/>

				<div
					className="dive-layer dive-layer--crisp"
					data-depth="0.05"
					style={{ "--layer-depth": 0.05 } as React.CSSProperties}
				>
					<Stars scrollProgress={scrollProgress} curve={celestial.curve} />
				</div>

				{(() => {
					const sunPos = celestialPosition(
						windowedProgress(scrollProgress, SUN_WINDOW),
						celestial.sun,
					);
					const sunOpacity = sunOpacityAt(scrollProgress);
					return (
						<div
							className="dive-layer absolute"
							data-depth="0.12"
							style={
								{
									left: `${sunPos.x}%`,
									top: `${sunPos.y}%`,
									transform: "translate(-50%, -50%)",
									opacity: sunOpacity,
									transition: "opacity 100ms linear",
									"--layer-depth": 0.12,
								} as React.CSSProperties
							}
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
							className="dive-layer absolute"
							data-depth="0.12"
							style={
								{
									left: `${moonPos.x}%`,
									top: `${moonPos.y}%`,
									transform: "translate(-50%, -50%)",
									opacity: moonOpacity,
									transition: "opacity 100ms linear",
									"--layer-depth": 0.12,
								} as React.CSSProperties
							}
						>
							<div className="w-20 h-20 bg-slate-100 rounded-full shadow-[0_0_60px_rgba(255,255,255,0.2)] border-4 border-slate-300 flex items-center justify-center overflow-hidden">
								<div className="w-6 h-6 rounded-full bg-slate-200 absolute top-2 right-4 opacity-60" />
								<div className="w-8 h-8 rounded-full bg-slate-200 absolute bottom-4 left-2 opacity-40" />
								<div className="w-4 h-4 rounded-full bg-slate-200 absolute top-8 left-8 opacity-50" />
							</div>
						</div>
					);
				})()}

				<div
					className="dive-layer"
					data-depth="0.55"
					style={{ "--layer-depth": 0.55 } as React.CSSProperties}
				>
					<PixelCloud
						x={100}
						y={150}
						scale={1.2}
						speed={0.05}
						scrollPos={scrollProgress * 1000}
					/>
				</div>
				<div
					className="dive-layer"
					data-depth="0.8"
					style={{ "--layer-depth": 0.8 } as React.CSSProperties}
				>
					<PixelCloud
						x={600}
						y={100}
						scale={0.8}
						speed={-0.08}
						scrollPos={scrollProgress * 1000}
					/>
				</div>
				<div
					className="dive-layer"
					data-depth="0.3"
					style={{ "--layer-depth": 0.3 } as React.CSSProperties}
				>
					<PixelCloud
						x={1000}
						y={250}
						scale={1}
						speed={0.03}
						scrollPos={scrollProgress * 1000}
					/>
				</div>

				<div
					className="dive-layer absolute bottom-0 w-full h-[40vh] pointer-events-none transition-opacity duration-100 ease-linear"
					data-depth="0.55"
					style={
						{
							opacity: Math.max(0.1, 0.4 - scrollProgress * 0.2),
							"--layer-depth": 0.55,
						} as React.CSSProperties
					}
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
			</div>

			<div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
		</div>
	);
}
