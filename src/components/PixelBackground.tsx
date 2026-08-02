import { memo, useMemo, useRef } from "react";
import { DEFAULT_CELESTIAL } from "../data/celestial";
import {
	BIRD_SPECIES_KEYS,
	BIRDS,
	birdFillAt,
	birdFlapCss,
	birdPool,
	CLOUD_TYPE_KEYS,
	CLOUDSCAPE,
	CONIFER_GRIDS,
	cloudFillAt,
	cloudPool,
	coniferFillAt,
	coniferStands,
	FIREFLIES,
	FIREFLY_GROUP_KEYS,
	FIREFLY_WARMS,
	fireflyGroupDepth,
	fireflyPool,
	gridPath,
	LAND_DEFAULT,
	MIST,
	MIST_GROUP_KEYS,
	mistFillAt,
	mistGroupDepth,
	mistPool,
	mulberry32,
	poolSize,
	presenceAt,
	presenceOver,
	ridgeFillsAt,
	ridgeSpecs,
	SCENE,
	trackAt,
	VEIL_BODIES,
	VEIL_STACK,
	windowedOver,
} from "../data/scene";
import { rgbToCss, SKY_NOON } from "../data/skyCurve";
import type { DiveRenderState } from "./_layout/dive/diveConstants";
import { useHandheldJitter } from "./_layout/dive/useHandheldJitter";
import type { Journey } from "./_layout/scrollJourney/useScrollJourney";
import { useJourneyRepaint } from "./_layout/scrollJourney/useScrollJourney";

// The celestial scene: sky, stars, sun, moon, clouds, birds, mist, fireflies,
// the ridge ladder and its conifer stands.
//
// Nothing here recomputes on scroll. The scroll journey is owned by
// useScrollJourney, which writes the sun/moon positions, the star opacities,
// the sky colour, the cloud gates and the ridge fills + parallax directly onto
// the elements registered in `journey.targets`. This component renders once and
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

// The star pool (prefix activation, wayfinder #61/#65): the schedule's max
// count is rendered once - the PRNG is seeded (see scene.ts: the star field
// must generate identically on server and client, or hydration mismatch #418
// returns), so the first 150 elements ARE the previously shipped star field.
// The driver activates a prefix per frame; a day sky runs zero of them.
const STAR_POOL = poolSize(SCENE.stars.count);
// The SSR markup activates the shipped 150 so a cold night deep-link shows
// stars on its pre-hydration frames; the driver owns the count afterwards.
const STAR_SSR_ACTIVE =
	typeof SCENE.stars.count === "number"
		? SCENE.stars.count
		: (SCENE.stars.count[0] ?? 0);

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
		return Array.from({ length: STAR_POOL }).map((_, i) => ({
			id: i,
			x: rand() * 100,
			y: rand() * 100,
			size: rand() * 2.5 + 0.5,
			delay: rand() * 5,
			duration: rand() * 3 + 2,
		}));
	}, []);

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
					if (!journey) return;
					journey.targets.stars = el;
					// The pool rides the same layer: registration (re)snapshots the
					// children and resets the activation cache, so a remount or a
					// React className restoration is healed by the next repaint.
					journey.targets.starPool = el
						? { els: Array.from(el.children) as HTMLElement[], applied: -1 }
						: null;
				}}
				className={`absolute inset-0${dense ? " stars-dense" : ""}`}
				style={{ opacity: "var(--stars-o, 0)" }}
			>
				{stars.map((star, i) => (
					<div
						key={star.id}
						className={`star-el absolute bg-white rounded-full animate-twinkle${
							i >= STAR_SSR_ACTIVE ? " scene-off" : ""
						}`}
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

// The cloud cast (wayfinder #78's layered ladder, wired on #65): one layer per
// type at its depth, each holding a seeded pool of wrap-drifting elements.
// Geometry is module-level and deterministic so SSR and client markup match.
// The progress-0 values below are the pre-hydration seed: the boot script
// overrides the layer opacity var on a cold deep-link, the driver takes over
// after hydration.
const CLOUD_POOLS = CLOUD_TYPE_KEYS.map((key) => cloudPool(key));
const CLOUD_INITIAL = CLOUD_TYPE_KEYS.map((key) => {
	const t = CLOUDSCAPE.types[key];
	const pres = presenceAt(0, t.window);
	return {
		o: pres * t.alpha,
		count:
			pres > 0 ? Math.round(trackAt(t.count, windowedOver(0, t.window))) : 0,
		fill: rgbToCss(cloudFillAt(SKY_NOON, t.depth)),
	};
});

function CloudTypeLayer({
	typeIndex,
	journey,
}: {
	typeIndex: number;
	journey?: Journey | undefined;
}) {
	const key = CLOUD_TYPE_KEYS[typeIndex] as (typeof CLOUD_TYPE_KEYS)[number];
	const t = CLOUDSCAPE.types[key];
	const initial = CLOUD_INITIAL[typeIndex];
	const pool = CLOUD_POOLS[typeIndex] ?? [];
	return (
		<div
			ref={(el) => {
				if (!journey) return;
				journey.targets.cloudTypes[typeIndex] = el
					? {
							layer: el,
							els: Array.from(el.children) as HTMLElement[],
							paths: Array.from(el.querySelectorAll("path")),
							applied: -1,
							appliedFill: "",
						}
					: null;
			}}
			className="absolute inset-0 overflow-hidden select-none pointer-events-none"
			style={{ opacity: `var(--cloud-${key}-o, ${initial?.o ?? 0})` }}
			aria-hidden="true"
		>
			{pool.map((seed, i) => (
				<div
					key={`${key}-${seed.leftPct.toFixed(2)}-${seed.topPct.toFixed(2)}`}
					className={`cloud-el absolute${
						i >= (initial?.count ?? 0) ? " scene-off" : ""
					}`}
					style={
						{
							left: `${seed.leftPct.toFixed(2)}%`,
							top: `${seed.topPct.toFixed(2)}%`,
							width: `${seed.widthPx.toFixed(0)}px`,
							height: `${seed.heightPx.toFixed(0)}px`,
							"--wdur": `${seed.durS.toFixed(1)}s`,
							"--wdel": `${seed.delayS.toFixed(1)}s`,
						} as React.CSSProperties
					}
				>
					<svg
						viewBox="0 0 100 60"
						preserveAspectRatio="none"
						className="w-full h-full"
						aria-hidden="true"
					>
						<path
							fill={initial?.fill ?? "white"}
							d={t.d}
							style={{ shapeRendering: "crispEdges" }}
						/>
					</svg>
				</div>
			))}
		</div>
	);
}

// The bird cast (wayfinder #80's three-species relay, built on #64): one layer
// per species at its depth, each holding a seeded pool of crossing flights.
// Geometry, pose paths and the wingbeat keyframes are module-level and
// deterministic so SSR and client markup match. The driver gates presence,
// live flights and fill; every motion channel is a CSS keyframe.
const BIRD_POOLS = BIRD_SPECIES_KEYS.map((key) => birdPool(key));
const BIRD_POSE_PATHS = BIRD_SPECIES_KEYS.map((key) =>
	BIRDS[key].sprite.poses.map((pose) => gridPath(pose)),
);
const BIRD_FLAP_CSS = birdFlapCss();

// The mist cast (wayfinder #79's interleaved veils, built on #84): one layer
// per group at its ridge-gap midpoint depth, each holding a seeded pool of
// stacked-bar veils that sway (and breathe) on the CSS clock. Geometry is
// module-level and deterministic so SSR and client markup match. The driver
// gates presence, activation, fill and the gap-depth parallax.
const MIST_POOLS = MIST_GROUP_KEYS.map((key) => mistPool(key));
const MIST_INITIAL = MIST_GROUP_KEYS.map((key) => {
	const g = MIST.groups[key];
	const pres = presenceOver(0, g.windows);
	return {
		o: pres * g.alpha,
		count: pres > 0 ? g.count : 0,
		fill: rgbToCss(mistFillAt(SKY_NOON, mistGroupDepth(key))),
	};
});

function MistGroupLayer({
	groupIndex,
	journey,
}: {
	groupIndex: number;
	journey?: Journey | undefined;
}) {
	const key = MIST_GROUP_KEYS[groupIndex] as (typeof MIST_GROUP_KEYS)[number];
	const initial = MIST_INITIAL[groupIndex];
	const pool = MIST_POOLS[groupIndex] ?? [];
	return (
		<div
			ref={(el) => {
				if (!journey) return;
				journey.targets.mistGroups[groupIndex] = el
					? {
							layer: el,
							els: Array.from(el.children) as HTMLElement[],
							paths: Array.from(el.querySelectorAll("path")),
							depth: mistGroupDepth(key),
							applied: -1,
							appliedFill: "",
						}
					: null;
			}}
			className="absolute inset-0 overflow-hidden select-none pointer-events-none"
			style={{ opacity: `var(--mist-${key}-o, ${initial?.o ?? 0})` }}
			aria-hidden="true"
		>
			{pool.map((seed, i) => (
				<div
					key={`${key}-${seed.leftVw.toFixed(2)}-${seed.bottomVh.toFixed(2)}`}
					className={`mist-el absolute${
						i >= (initial?.count ?? 0) ? " scene-off" : ""
					}`}
					style={
						{
							left: `${seed.leftVw.toFixed(1)}vw`,
							bottom: `${seed.bottomVh.toFixed(1)}vh`,
							width: `${seed.widthVw.toFixed(1)}vw`,
							height: `${seed.heightVh.toFixed(1)}vh`,
							"--mamp": `${seed.ampPx.toFixed(0)}px`,
							"--mdur": `${seed.swayDurS.toFixed(1)}s`,
							"--mdel": `${seed.delayS.toFixed(1)}s`,
						} as React.CSSProperties
					}
				>
					<svg
						viewBox="0 0 200 40"
						preserveAspectRatio="none"
						className="w-full h-full"
						aria-hidden="true"
					>
						{VEIL_STACK.map((bar) => (
							<path
								key={bar.transform}
								d={VEIL_BODIES[seed.body]}
								transform={bar.transform}
								fill={initial?.fill ?? "white"}
								fillOpacity={bar.fillOpacity}
								style={{ shapeRendering: "crispEdges" }}
							/>
						))}
					</svg>
				</div>
			))}
		</div>
	);
}

// The firefly cast (wayfinder #81's dusk-to-night glow, built on #85): one
// layer per group at its ridge-gap midpoint depth, each holding a seeded pool
// of flies that sway, bob and blink on the CSS clock. Geometry is module-level
// and deterministic so SSR and client markup match. Every window opens after
// sunset, so the pre-hydration presence is 0 and the pool renders fully off;
// the boot script seeds `--ff-<group>-o` (and `--ff-night`) for a cold night
// deep-link. Colour is fixed warm markup (the emitter exemption) - the driver
// gates presence, activation, the halo's `--ff-night` and the gap parallax.
const FIREFLY_POOLS = FIREFLY_GROUP_KEYS.map((key) => fireflyPool(key));
const FIREFLY_INITIAL = FIREFLY_GROUP_KEYS.map((key) => {
	const g = FIREFLIES.groups[key];
	const pres = presenceOver(0, g.windows);
	return { o: pres, count: pres > 0 ? (g.count[0] ?? 0) : 0 };
});

function FireflyGroupLayer({
	groupIndex,
	journey,
}: {
	groupIndex: number;
	journey?: Journey | undefined;
}) {
	const key = FIREFLY_GROUP_KEYS[
		groupIndex
	] as (typeof FIREFLY_GROUP_KEYS)[number];
	const g = FIREFLIES.groups[key];
	const initial = FIREFLY_INITIAL[groupIndex];
	const pool = FIREFLY_POOLS[groupIndex] ?? [];
	const warm = FIREFLY_WARMS[g.color];
	const warmCss = rgbToCss(warm);
	// The core square sits centred inside the glow box (the halo's viewBox).
	const boxPx = Math.max(4, g.size * g.glow);
	const coreSide = 100 / Math.max(g.glow, 1.2);
	const coreOff = (100 - coreSide) / 2;
	return (
		<div
			ref={(el) => {
				if (!journey) return;
				journey.targets.fireflyGroups[groupIndex] = el
					? {
							layer: el,
							els: Array.from(el.children) as HTMLElement[],
							depth: fireflyGroupDepth(key),
							applied: -1,
							appliedNight: "",
						}
					: null;
			}}
			className="absolute inset-0 overflow-hidden select-none pointer-events-none"
			style={{ opacity: `var(--ff-${key}-o, ${initial?.o ?? 0})` }}
			aria-hidden="true"
		>
			{pool.map((seed, i) => (
				<div
					key={`${key}-${seed.leftVw.toFixed(2)}-${seed.bottomVh.toFixed(2)}`}
					className={`ff-el${g.rhythm === "pulse" ? " ff-el--pulse" : ""}${
						i >= (initial?.count ?? 0) ? " scene-off" : ""
					}`}
					style={
						{
							left: `${seed.leftVw.toFixed(1)}vw`,
							bottom: `${seed.bottomVh.toFixed(1)}vh`,
							width: `${boxPx.toFixed(0)}px`,
							height: `${boxPx.toFixed(0)}px`,
							"--fdim": g.dim,
							"--famp": `${seed.swayAmpPx.toFixed(0)}px`,
							"--fsdur": `${seed.swayDurS.toFixed(1)}s`,
							"--fsdel": `${seed.swayDelayS.toFixed(1)}s`,
							"--fbamp": `${seed.bobAmpPx.toFixed(0)}px`,
							"--fbdur": `${seed.bobDurS.toFixed(1)}s`,
							"--fbdel": `${seed.bobDelayS.toFixed(1)}s`,
							"--fbldur": `${seed.blinkDurS.toFixed(2)}s`,
							"--fbldel": `${seed.blinkDelayS.toFixed(2)}s`,
						} as React.CSSProperties
					}
				>
					<div className="ff-sway">
						<div className="ff-bob">
							<svg
								viewBox="0 0 100 100"
								className="w-full h-full"
								aria-hidden="true"
							>
								<defs>
									<radialGradient id={`ffg-${key}-${i}`}>
										<stop offset="0" stopColor={warmCss} stopOpacity="0.55" />
										<stop
											offset="0.55"
											stopColor={warmCss}
											stopOpacity="0.18"
										/>
										<stop offset="1" stopColor={warmCss} stopOpacity="0" />
									</radialGradient>
								</defs>
								<circle
									className="ff-halo"
									cx="50"
									cy="50"
									r="49"
									fill={`url(#ffg-${key}-${i})`}
								/>
								<rect
									x={coreOff.toFixed(1)}
									y={coreOff.toFixed(1)}
									width={coreSide.toFixed(1)}
									height={coreSide.toFixed(1)}
									fill={warmCss}
									style={{ shapeRendering: "crispEdges" }}
								/>
							</svg>
						</div>
					</div>
				</div>
			))}
		</div>
	);
}

// The ridge ladder (#62): ten seeded silhouettes, farthest first, replacing
// the single translucent landscape path. Geometry is module-level and
// deterministic so SSR and client markup match. The day fills below are the
// pre-hydration fallback; the boot script seeds `--ridge<i>-f` for a cold
// deep-link and the driver overwrites the inline style after hydration.
const RIDGE_SPECS = ridgeSpecs();
const RIDGE_INITIAL_RGB = ridgeFillsAt(SKY_NOON, LAND_DEFAULT);
const RIDGE_INITIAL_FILLS = RIDGE_INITIAL_RGB.map(rgbToCss);

// The conifer stands (#82's tree line, built on #86): each stand is a child
// of its ridge layer, so it inherits the depth, the parallax translate and
// the paint order - and the next opaque ridge occludes it for free. Geometry
// is module-level and deterministic so SSR and client markup match. Sway is
// per tree on the `rotate` longhand, on the CSS clock (#60); the driver only
// writes one sky-derived fill per stand. ~20 trees animate against #71's
// ~250 ceiling. The day fills below are the pre-hydration fallback; the boot
// script seeds `--tree<i>-f` for a cold deep-link.
const CONIFER_STANDS = coniferStands();
const CONIFER_STAND_BY_RIDGE = new Map(CONIFER_STANDS.map((s) => [s.ridge, s]));
const CONIFER_SPRITES = Object.fromEntries(
	Object.entries(CONIFER_GRIDS).map(([kind, tiers]) => [
		kind,
		Object.fromEntries(
			Object.entries(tiers).map(([tier, rows]) => [
				tier,
				{ d: gridPath([...rows]), w: rows[0]?.length ?? 1, h: rows.length },
			]),
		),
	]),
) as Record<
	keyof typeof CONIFER_GRIDS,
	Record<"near" | "far", { d: string; w: number; h: number }>
>;
const CONIFER_INITIAL_FILLS = new Map(
	CONIFER_STANDS.map((s) => {
		const tone = RIDGE_INITIAL_RGB[s.ridge] ?? SKY_NOON;
		return [s.ridge, rgbToCss(coniferFillAt(tone, s.t, SKY_NOON))];
	}),
);
const BIRD_INITIAL = BIRD_SPECIES_KEYS.map((key) => {
	const sp = BIRDS[key];
	const pres = presenceAt(0, sp.window);
	return {
		o: pres * sp.alpha,
		count: pres > 0 ? Math.max(1, Math.round(sp.flights * pres)) : 0,
		fill: rgbToCss(birdFillAt(SKY_NOON, sp.depth)),
	};
});

function BirdSpeciesLayer({
	speciesIndex,
	journey,
}: {
	speciesIndex: number;
	journey?: Journey | undefined;
}) {
	const key = BIRD_SPECIES_KEYS[
		speciesIndex
	] as (typeof BIRD_SPECIES_KEYS)[number];
	const sp = BIRDS[key];
	const initial = BIRD_INITIAL[speciesIndex];
	const pool = BIRD_POOLS[speciesIndex] ?? [];
	const posePaths = BIRD_POSE_PATHS[speciesIndex] ?? [];
	return (
		<div
			ref={(el) => {
				if (!journey) return;
				journey.targets.birdSpecies[speciesIndex] = el
					? {
							layer: el,
							els: Array.from(el.children) as HTMLElement[],
							applied: -1,
							appliedFill: "",
						}
					: null;
			}}
			className="bird-layer absolute inset-0 overflow-hidden select-none pointer-events-none"
			style={{
				opacity: `var(--bird-${key}-o, ${initial?.o ?? 0})`,
				color: initial?.fill ?? "black",
			}}
			aria-hidden="true"
		>
			{pool.map((flight, f) => (
				<div
					// biome-ignore lint/suspicious/noArrayIndexKey: the seeded pool is static and never reorders (prefix activation depends on stable order)
					key={`${key}-${f}`}
					className={`bird-flight absolute inset-0${
						sp.rightward ? "" : " bird-flight--rev"
					}${f >= (initial?.count ?? 0) ? " scene-off" : ""}`}
					style={
						{
							"--bdur": `${flight.durS.toFixed(1)}s`,
							"--bdel": `${flight.delayS.toFixed(1)}s`,
						} as React.CSSProperties
					}
				>
					<div
						className={
							sp.path === "straight"
								? "absolute inset-0"
								: `absolute inset-0 bird-path-${sp.path}`
						}
						style={
							sp.path === "straight"
								? undefined
								: ({
										"--pdur": `${flight.pathDurS.toFixed(1)}s`,
										"--pdel": `${flight.pathDelayS.toFixed(1)}s`,
										"--amp": `${flight.pathAmpVh.toFixed(1)}vh`,
									} as React.CSSProperties)
						}
					>
						{flight.birds.map((bird, b) => (
							<div
								// biome-ignore lint/suspicious/noArrayIndexKey: formation slot order IS the identity of a bird in its flight
								key={`${key}-${f}-${b}`}
								className={`bird-el bird-el--${key} absolute`}
								style={
									{
										left: `${bird.leftPct.toFixed(2)}%`,
										bottom: `${bird.bottomVh.toFixed(2)}vh`,
										width: `${bird.widthVmin.toFixed(2)}vmin`,
										height: `${bird.heightVmin.toFixed(2)}vmin`,
										"--fdel": `${bird.flapDelayS.toFixed(2)}s`,
									} as React.CSSProperties
								}
							>
								<svg
									viewBox={`0 0 ${sp.sprite.w} ${sp.sprite.h}`}
									preserveAspectRatio="xMidYMid meet"
									className="w-full h-full overflow-visible"
									aria-hidden="true"
								>
									{posePaths.map((d, p) => (
										<path
											// biome-ignore lint/suspicious/noArrayIndexKey: pose order IS the identity (flap keyframes target nth-child)
											key={p}
											className="bird-pose"
											d={d}
											fill="currentColor"
											style={{ shapeRendering: "crispEdges" }}
										/>
									))}
								</svg>
							</div>
						))}
					</div>
				</div>
			))}
		</div>
	);
}

function PixelBackgroundInner({
	journey,
	dive,
	// Atmosphere toy: sun + celestial-extras overrides. All optional; the
	// defaults reproduce the original scene exactly. The palette's landscape
	// colour reaches the ridges through the journey (useScrollJourney's
	// `landscape`), because ridge fills are driver-derived per frame.
	sunColor,
	extras,
}: {
	journey?: Journey | undefined;
	dive?: DiveRenderState | undefined;
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

	// Paint order equals depth order (#73). Layers are authored below in the
	// old authoring order, then stable-sorted by --layer-depth before painting.
	// Authoring order used to decide paint order, which left the depth-0.8
	// cloud behind the depth-0.55 landscape. The sort is stable, so equal
	// depths (sun/moon/moon2 at 0.12, the 0.55 cloud under the land) keep
	// their authoring order.
	const layers: { depth: number; node: React.ReactNode }[] = [
		{
			depth: 0,
			node: (
				<div
					key="sky"
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
			),
		},
		{
			depth: 0.05,
			node: (
				<div
					key="stars"
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
			),
		},
		{
			depth: 0.12,
			node: (
				<div
					key="sun"
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
			),
		},
		{
			depth: 0.12,
			node: (
				<div
					key="moon"
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
			),
		},
	];

	// Atmosphere toy: extra companion moon (celestial extra).
	if (extras?.extraMoon) {
		layers.push({
			depth: 0.12,
			node: (
				<div
					key="moon2"
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
			),
		});
	}

	CLOUD_TYPE_KEYS.forEach((key, i) => {
		const depth = CLOUDSCAPE.types[key].depth;
		layers.push({
			depth,
			node: (
				<div
					key={`clouds-${key}`}
					className="dive-layer"
					data-depth={depth}
					style={{ "--layer-depth": depth } as React.CSSProperties}
				>
					<CloudTypeLayer typeIndex={i} journey={journey} />
				</div>
			),
		});
	});

	BIRD_SPECIES_KEYS.forEach((key, i) => {
		const depth = BIRDS[key].depth;
		layers.push({
			depth,
			node: (
				<div
					key={`birds-${key}`}
					className="dive-layer"
					data-depth={depth}
					style={{ "--layer-depth": depth } as React.CSSProperties}
				>
					<BirdSpeciesLayer speciesIndex={i} journey={journey} />
				</div>
			),
		});
	});

	// The mist veils (#84): each group is its own dive-layer at its ridge-gap
	// midpoint depth, so the depth sort slots the veil BETWEEN its two ridges
	// and the front ridge's peaks cut across it.
	MIST_GROUP_KEYS.forEach((key, i) => {
		const depth = mistGroupDepth(key);
		layers.push({
			depth,
			node: (
				<div
					key={`mist-${key}`}
					className="dive-layer dive-layer--mist"
					data-depth={depth}
					style={{ "--layer-depth": depth } as React.CSSProperties}
				>
					<MistGroupLayer groupIndex={i} journey={journey} />
				</div>
			),
		});
	});

	// The fireflies (#85): each group is its own dive-layer at its ridge-gap
	// midpoint depth, like the mist, so the front ridge's peaks cut across the
	// band. The firefly-layer class is the reduced-motion removal hook
	// (creatures are removed, vapors freeze - brief #77 rule 7).
	FIREFLY_GROUP_KEYS.forEach((key, i) => {
		const depth = fireflyGroupDepth(key);
		layers.push({
			depth,
			node: (
				<div
					key={`fireflies-${key}`}
					className="dive-layer firefly-layer"
					data-depth={depth}
					style={{ "--layer-depth": depth } as React.CSSProperties}
				>
					<FireflyGroupLayer groupIndex={i} journey={journey} />
				</div>
			),
		});
	});

	// The ridge ladder (#62): each ridge is its own dive-layer at its depth, so
	// the depth sort interleaves the clouds between the mountains. The driver
	// writes the parallax offset on the layer's `translate` longhand (never
	// `transform` - that channel belongs to the dive, #59) and one opaque fill
	// per ridge. The ridge box overscans past every edge by the full travel so
	// a risen ridge never pulls its bottom edge into view.
	RIDGE_SPECS.forEach((r, i) => {
		const stand = CONIFER_STAND_BY_RIDGE.get(r.index);
		const treeFill = CONIFER_INITIAL_FILLS.get(r.index);
		layers.push({
			depth: r.depth,
			node: (
				<div
					key={`ridge-${r.index}`}
					ref={(el) => {
						if (!journey) return;
						journey.targets.ridges[i] = el
							? {
									layer: el,
									path: el.querySelector("path") as SVGPathElement,
									base: el.querySelector(".scene-ridge-base") as HTMLElement,
									trees: Array.from(
										el.querySelectorAll(".scene-trees path"),
									) as SVGPathElement[],
									depth: r.depth,
									appliedFill: "",
									appliedTreeFill: "",
								}
							: null;
					}}
					className="dive-layer dive-layer--ridge absolute inset-0 pointer-events-none"
					data-depth={r.depth}
					style={{ "--layer-depth": r.depth } as React.CSSProperties}
				>
					<div
						className="scene-ridge"
						style={
							{ "--rh": `${r.heightVh.toFixed(1)}vh` } as React.CSSProperties
						}
						aria-hidden="true"
					>
						<svg
							viewBox="0 0 1000 400"
							preserveAspectRatio="none"
							aria-hidden="true"
						>
							<path
								d={r.d}
								style={{
									fill: `var(--ridge${i}-f, ${RIDGE_INITIAL_FILLS[i]})`,
									shapeRendering: "crispEdges",
								}}
							/>
						</svg>
						<div
							className="scene-ridge-base"
							style={{
								backgroundColor: `var(--ridge${i}-f, ${RIDGE_INITIAL_FILLS[i]})`,
							}}
						/>
						{stand && (
							<div className="scene-trees" aria-hidden="true">
								{stand.trees.map((tree) => {
									const spr = CONIFER_SPRITES[tree.kind][tree.tier];
									return (
										<div
											key={`${tree.leftPct.toFixed(2)}-${tree.heightVh.toFixed(2)}`}
											className={`scene-tree${
												stand.sways ? " scene-tree--sways" : ""
											}`}
											style={
												{
													left: `${tree.leftPct.toFixed(2)}%`,
													bottom: `${tree.bottomPct.toFixed(2)}%`,
													width: `${tree.widthVh.toFixed(2)}vh`,
													height: `${tree.heightVh.toFixed(2)}vh`,
													marginLeft: `${(-tree.widthVh / 2).toFixed(2)}vh`,
													marginBottom: `${(-tree.sinkVh).toFixed(2)}vh`,
													"--tamp": `${tree.ampDeg.toFixed(2)}deg`,
													"--tdur": `${tree.swayDurS.toFixed(1)}s`,
													"--tdel": `${tree.delayS.toFixed(1)}s`,
													"--pose": `${tree.poseDeg.toFixed(2)}deg`,
												} as React.CSSProperties
											}
										>
											<svg
												viewBox={`0 0 ${spr.w} ${spr.h}`}
												preserveAspectRatio="none"
												className="w-full h-full"
												aria-hidden="true"
											>
												<path
													d={spr.d}
													style={{
														fill: `var(--tree${i}-f, ${treeFill ?? "black"})`,
														shapeRendering: "crispEdges",
													}}
												/>
											</svg>
										</div>
									);
								})}
							</div>
						)}
					</div>
				</div>
			),
		});
	});

	layers.sort((a, b) => a.depth - b.depth);

	return (
		<div className="dive-viewport fixed inset-y-0 left-0 right-0 md:right-20 -z-10">
			{/* The generated wingbeat keyframes (step-end pose cuts per species).
			    Deterministic module-level text, so SSR and client agree. */}
			<style
				// biome-ignore lint/security/noDangerouslySetInnerHtml: deterministic generated keyframes from scene.ts
				dangerouslySetInnerHTML={{ __html: BIRD_FLAP_CSS }}
			/>
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
				{layers.map((layer) => layer.node)}
			</div>
		</div>
	);
}

// Memoised: the driver writes inline styles imperatively, so an unrelated
// re-render of LayoutHost must not walk this subtree (150-340 star nodes).
export const PixelBackground = memo(PixelBackgroundInner);
