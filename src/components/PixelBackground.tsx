import { memo, useMemo, useRef } from "react";
import { DEFAULT_CELESTIAL } from "../data/celestial";
import { rgbToCss, SKY_NOON } from "../data/skyCurve";
import type { DiveRenderState } from "./_layout/dive/diveConstants";
import { useHandheldJitter } from "./_layout/dive/useHandheldJitter";
import { CLOUDS, cloudTransform } from "./_layout/scrollJourney/journeyValues";
import type { Journey } from "./_layout/scrollJourney/useScrollJourney";
import { useJourneyRepaint } from "./_layout/scrollJourney/useScrollJourney";

// The celestial scene: sky, stars, sun, moon, parallax clouds, landscape.
//
// Nothing here recomputes on scroll. The scroll journey is owned by
// useScrollJourney, which writes the sun/moon positions, the star opacities,
// the sky colour, the cloud transforms and the landscape fade directly onto the
// elements registered in `journey.targets`. This component renders once and
// then holds still - see journeyTargets.ts for why direct writes rather than
// custom properties on the root.
//
// The inline `var(--sun-x, ...)` references remain as the pre-hydration seed:
// the boot script (skyBoot.ts) sets those vars before the first paint on a cold
// deep-link, so the scene is at the right time-of-day from frame one. The
// driver takes over after hydration, and useJourneyRepaint re-asserts it after
// any re-render (which would otherwise restore these var references).

// Progress-0 (day) positions, used as the CSS-var fallback for the raw SSR
// frame before the boot script runs.
const SUN_DAY = DEFAULT_CELESTIAL.sun;
const MOON_DAY = DEFAULT_CELESTIAL.moon;

// Deterministic PRNG (mulberry32): the star field is generated identically on
// the server and the client so the SSR HTML and the first client render match.
// Math.random() here made every page's star positions differ between the two,
// which tripped a hydration mismatch (#418) that discarded the whole SSR tree
// and re-rendered it on the client - the flash of the main page rebuilding
// behind a subpage panel. A fixed seed keeps the layout stable across loads.
function mulberry32(seed: number): () => number {
	let a = seed;
	return () => {
		a |= 0;
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

function Stars({
	dense = false,
	forceShoot = false,
	journey,
}: {
	dense?: boolean;
	forceShoot?: boolean;
	journey?: Journey | undefined;
}) {
	const stars = useMemo(() => {
		const rand = mulberry32(0x5eed);
		return Array.from({ length: dense ? 340 : 150 }).map((_, i) => ({
			id: i,
			x: rand() * 100,
			y: rand() * 100,
			size: rand() * 2.5 + 0.5,
			delay: rand() * 5,
			duration: rand() * 3 + 2,
		}));
	}, [dense]);

	const shootingStars = useMemo(() => {
		const rand = mulberry32(0x5140);
		return Array.from({ length: 6 }).map((_, i) => ({
			id: i,
			top: rand() * 40,
			delay: rand() * 12 + i * 4,
		}));
	}, []);

	return (
		<div className="absolute inset-0 overflow-hidden pointer-events-none">
			{/* The two fade layers are driven directly. They used to carry
			    `transition-opacity duration-100`, which - fed a per-frame driver -
			    only held the star field 100ms behind the scroll. */}
			<div
				ref={(el) => {
					if (journey) journey.targets.stars = el;
				}}
				className="absolute inset-0"
				style={{ opacity: "var(--stars-o, 0)" }}
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
				ref={(el) => {
					// The toy's forced-shooting-star override wins; when it is on, the
					// driver must not fight it for this element.
					if (journey) journey.targets.shoot = forceShoot ? null : el;
				}}
				className="absolute inset-0"
				style={{ opacity: forceShoot ? 1 : "var(--shoot-o, 0)" }}
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

// Geometry comes from the shared CLOUDS table so the driver rebuilds the same
// transform this renders initially. The old `transition: transform 0.1s linear`
// is gone: with a per-frame driver it smoothed nothing and visibly lagged.
function PixelCloud({
	index,
	journey,
}: {
	index: number;
	journey?: Journey | undefined;
}) {
	return (
		<svg
			ref={(el) => {
				if (journey) journey.targets.clouds[index] = el;
			}}
			viewBox="0 0 100 60"
			className="absolute opacity-40 select-none pointer-events-none"
			style={{
				width: "120px",
				height: "auto",
				left: 0,
				top: 0,
				transform: cloudTransform(index, 0),
				willChange: "transform",
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

function PixelBackgroundInner({
	journey,
	dive,
	// Atmosphere toy: palette + celestial-extras overrides. All optional; the
	// defaults reproduce the original scene exactly.
	landscapeColor = "#4a7a8c",
	sunColor,
	extras,
}: {
	journey?: Journey | undefined;
	dive?: DiveRenderState | undefined;
	landscapeColor?: string;
	sunColor?: { bg: string; border: string } | undefined;
	extras?:
		| { extraMoon: boolean; denseStars: boolean; shootingStar: boolean }
		| undefined;
}) {
	const sceneRef = useRef<HTMLDivElement>(null);

	// rAF colocated with the scene element it writes to: the handheld technique's
	// faint jitter runs only while a handheld dive is at depth (dive.u === 1).
	useHandheldJitter({
		sceneRef,
		active: dive?.technique === "handheld" && dive.u === 1,
	});

	// Any re-render (a dive, a palette change) restores the var() references
	// below, so put the live frame back before the browser paints.
	useJourneyRepaint(journey);

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
			    auto-selects lens-warp, so this stays OFF for every adaptive dive - it
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
					ref={(el) => {
						if (journey) journey.targets.sky = el;
					}}
					className="dive-layer absolute inset-0"
					data-depth="0"
					style={
						{
							// Seeded from --sky-now (boot script owns the first frame, the
							// driver owns it after). The old `transition-colors duration-100`
							// is gone - it held the sky a tenth of a second behind the scroll.
							backgroundColor: `var(--sky-now, ${rgbToCss(SKY_NOON)})`,
							"--layer-depth": 0,
						} as React.CSSProperties
					}
				/>

				<div
					className="dive-layer dive-layer--crisp"
					data-depth="0.05"
					style={{ "--layer-depth": 0.05 } as React.CSSProperties}
				>
					<Stars
						dense={extras?.denseStars ?? false}
						forceShoot={extras?.shootingStar ?? false}
						journey={journey}
					/>
				</div>

				<div
					ref={(el) => {
						if (journey) journey.targets.sun = el;
					}}
					className="dive-layer absolute"
					data-depth="0.12"
					style={
						{
							left: `var(--sun-x, ${SUN_DAY.startX}%)`,
							top: `var(--sun-y, ${SUN_DAY.startY}%)`,
							transform: "translate(-50%, -50%)",
							opacity: "var(--sun-o, 1)",
							"--layer-depth": 0.12,
						} as React.CSSProperties
					}
				>
					<div
						className="w-24 h-24 bg-yellow-200 rounded-full shadow-[0_0_40px_rgba(253,224,71,0.5)] border-4 border-yellow-300"
						style={
							sunColor
								? { backgroundColor: sunColor.bg, borderColor: sunColor.border }
								: undefined
						}
					/>
				</div>

				<div
					ref={(el) => {
						if (journey) journey.targets.moon = el;
					}}
					className="dive-layer absolute"
					data-depth="0.12"
					style={
						{
							left: `var(--moon-x, ${MOON_DAY.startX}%)`,
							top: `var(--moon-y, ${MOON_DAY.startY}%)`,
							transform: "translate(-50%, -50%)",
							opacity: "var(--moon-o, 0)",
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

				{/* Atmosphere toy: extra companion moon (celestial extra). */}
				{extras?.extraMoon && (
					<div
						ref={(el) => {
							if (journey) journey.targets.moon2 = el;
						}}
						className="dive-layer absolute"
						data-depth="0.12"
						style={
							{
								left: `var(--moon-x, ${MOON_DAY.startX}%)`,
								top: `var(--moon-y, ${MOON_DAY.startY}%)`,
								transform: "translate(-165%, -150%)",
								opacity: "var(--moon-o, 0)",
								"--layer-depth": 0.12,
							} as React.CSSProperties
						}
					>
						<div className="w-12 h-12 bg-slate-100 rounded-full shadow-[0_0_40px_rgba(255,255,255,0.2)] border-4 border-slate-300" />
					</div>
				)}

				{CLOUDS.map((cloud, i) => (
					<div
						key={`cloud-${cloud.x}-${cloud.y}`}
						className="dive-layer"
						data-depth={cloud.depth}
						style={{ "--layer-depth": cloud.depth } as React.CSSProperties}
					>
						<PixelCloud index={i} journey={journey} />
					</div>
				))}

				<div
					ref={(el) => {
						if (journey) journey.targets.land = el;
					}}
					className="dive-layer absolute bottom-0 w-full h-[40vh] pointer-events-none"
					data-depth="0.55"
					style={
						{
							opacity: "var(--land-o, 0.4)",
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
							fill={landscapeColor}
							d="M0 400V300l100-50h50l100 100h50l150-150h50l100 80h100l200-180h100v300z"
							style={{ shapeRendering: "crispEdges" }}
						/>
					</svg>
				</div>
			</div>
		</div>
	);
}

// Memoised: the driver writes inline styles imperatively, so an unrelated
// re-render of LayoutHost must not walk this subtree (150-340 star nodes).
export const PixelBackground = memo(PixelBackgroundInner);
