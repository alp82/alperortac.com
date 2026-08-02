import { createFileRoute, Outlet, useMatches } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { CraftSection } from "../components/_layout/CraftSection";
import {
	type ComposerState,
	DEFAULT_STATE,
} from "../components/_layout/composer/useComposerControls";
import { DesignModeHost } from "../components/_layout/DesignModeHost";
import {
	BASE_DIVE_BLUR,
	DIVE_DURATION_MS,
	type DiveRenderState,
	TRUE_NIGHT_DIVE_THRESHOLD,
} from "../components/_layout/dive/diveConstants";
import {
	blurStrengthFor,
	techniqueFor,
} from "../components/_layout/dive/techniqueFor";
import { FindMeSection } from "../components/_layout/FindMeSection";
import { FooterSection } from "../components/_layout/footer/FooterSection";
import { HeroSection } from "../components/_layout/HeroSection";
import { deriveUrlPanel, PanelHost } from "../components/_layout/PanelHost";
import { ProjectsSection } from "../components/_layout/ProjectsSection";
// The atmospheric-playground toy (#38 / #32): the always-on visitor sky toy.
import {
	AtmosphereToy,
	paletteAnchorsFor,
	paletteVisualsFor,
	softSlice,
	usePlayground,
} from "../components/_layout/playground/AtmosphereToy";
import { RhythmGap } from "../components/_layout/RhythmGap";
import { useScrollJourney } from "../components/_layout/scrollJourney/useScrollJourney";
import { Minimap } from "../components/Minimap";
import { NarrativeWatermark } from "../components/NarrativeWatermark";
import { SUBPAGE_WORDS } from "../components/narrativeWatermark";
import { PixelBackground } from "../components/PixelBackground";
import { useIsomorphicLayoutEffect } from "../components/useIsomorphicLayoutEffect";
import { type CelestialState, DEFAULT_CELESTIAL } from "../data/celestial";
import {
	armSmoothScroll,
	handleScrollTopClick,
	type PanelKey,
	SECTION_IDS,
	shouldArmSmoothForClick,
} from "../data/sections";
import { coldEntryFor } from "../data/skyBoot";
import { NIGHT_UI_THRESHOLD } from "../data/skyCurve";
import { PANEL_KEY_TO_TOPIC_ID, TOPICS } from "../data/topics";

export const Route = createFileRoute("/_layout")({ component: LayoutHost });

function LayoutHost() {
	// The SETTLED scroll position, mirrored into React only for the consumers
	// that need a render (the night UI flip, the atmosphere dial). The live
	// per-frame value never comes through here - see useScrollJourney.
	const [scrollProgress, setScrollProgress] = useState(0);
	// Session-only tuning state, seeded from the source-of-truth defaults. Nothing
	// is persisted, so an edit to celestial.ts always shows up on the next reload.
	const [celestial, setCelestial] = useState<CelestialState>(DEFAULT_CELESTIAL);
	// Atmosphere toy state (time-slice override + palette + extras). The scroll
	// driver keeps its own refs on the curve and the palette, so nothing needs to
	// be mirrored here.
	const [playground, playgroundApi] = usePlayground();
	// Hoisted above the scroll driver, which needs both.
	const paletteAnchors = paletteAnchorsFor(playground.palette);
	const sliceFor = useCallback(
		(raw: number) =>
			playground.time != null ? softSlice(playground.time, raw) : raw,
		[playground.time],
	);
	const [skyOpen, setSkyOpen] = useState(false);
	const [aboutOpen, setAboutOpen] = useState(false);
	const aboutMenuRef = useRef<HTMLDivElement | null>(null);
	const lastTriggerRef = useRef<HTMLElement | null>(null);
	const navRef = useRef<HTMLElement | null>(null);
	const mainShellRef = useRef<HTMLDivElement | null>(null);
	const [dive, setDive] = useState<DiveRenderState | undefined>(undefined);
	// The open subpage, derived straight from the route (not a post-hydration
	// effect) so the watermark side-text and the minimap render their correct
	// state on the SSR + first client paint. Seeding this from an effect made the
	// minimap flash in then unmount, and the side-text swap, on a cold subpage
	// load. Gated by skyOpen to mirror PanelHost's openPanel: the sky dev overlay
	// takes precedence and reveals the minimap/scroll watermark beneath it.
	const matches = useMatches();
	const subpageKey: PanelKey | null = skyOpen ? null : deriveUrlPanel(matches);
	const diveExitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	// Ref-tracked scroll progress so onPanelChange does not change identity on
	// every scroll tick (avoids the stuck-dive-active bug from re-firing close).
	const scrollProgressRef = useRef(0);
	// Guards the exit teardown: prevents close-branch from rescheduling the exit
	// timer when no dive is actually live (e.g. scroll during the 760ms exit window).
	const diveActiveRef = useRef(false);
	// Frozen while a detail subpage is open: the day/night driver must not advance
	// from scroll while in a subpage. The html scroller is also locked (CSS), but
	// this gate is the guaranteed freeze.
	const panelOpenRef = useRef(false);
	// Assigned right after useScrollJourney below; read by the []-stable
	// onPanelChange callback.
	const journeyRef = useRef<ReturnType<typeof useScrollJourney>>(
		null as unknown as ReturnType<typeof useScrollJourney>,
	);

	// Drive the live-landscape dive from the panel host. On open, aim the zoom at
	// the trigger's on-screen center and push --dive-u to 1 (CSS transitions the
	// per-layer zoom/blur). On close, ease --dive-u back to 0, then - after the
	// return transition - drop body.dive-active (which holds the 3D context) and
	// clear the dive vars. M2 ships glide only; other techniques land in M3.
	const onPanelChange = useCallback(
		(info: {
			key: PanelKey | null;
			side: "left" | "right" | null;
			rect: DOMRect | null;
		}) => {
			panelOpenRef.current = info.key !== null;
			if (info.key !== null) {
				// Open branch: arm a fresh dive.
				if (diveExitTimerRef.current) {
					clearTimeout(diveExitTimerRef.current);
					diveExitTimerRef.current = null;
				}
				const rect = info.rect;
				// Direct URL load (no trigger rect): the window is at scroll 0 (day, top),
				// so the backdrop and close/return target are wrong. Park the journey at
				// the subpage's topic section so the sky reflects the right time-of-day and
				// closing returns to that spot. The day/night driver is gated while a panel
				// is open (panelOpenRef short-circuits seedSkyAt), so after the
				// programmatic scroll we update scrollProgress/scrollY ourselves.
				if (rect == null) {
					// Cold entry (fresh load / reload straight onto a subpage URL): no
					// trigger to dive from. Jump the journey instantly to the subpage's
					// topic section - scroll-behavior is auto unless a click armed it, so
					// this lands with no visible travel - park the sky at that spot, and
					// return WITHOUT arming the dive: the panel simply appears already
					// open. The glide dive is an in-app trigger->panel transition and has
					// no meaning here (no origin to zoom from).
					const topicId = PANEL_KEY_TO_TOPIC_ID[info.key];
					const el = topicId ? document.getElementById(topicId) : null;
					if (el) {
						const targetY = el.offsetTop;
						window.scrollTo(0, targetY);
						// Paint through the driver even though the panel is open: a cold
						// subpage load has to show the parked time-of-day behind it.
						const { progress } = journeyRef.current.applyAt(targetY);
						scrollProgressRef.current = progress;
						setScrollProgress(progress);
					}
					return;
				}
				// Past the cold-entry return above, a trigger rect is always present:
				// this is an in-app click, so aim the zoom at the trigger's on-screen
				// center and fire the dive.
				const origin = `${
					((rect.left + rect.width / 2) / window.innerWidth) * 100
				}% ${((rect.top + rect.height / 2) / window.innerHeight) * 100}%`;
				document.body.classList.add("dive-active");
				diveActiveRef.current = true;
				const isTrueNight =
					scrollProgressRef.current >= TRUE_NIGHT_DIVE_THRESHOLD;
				setDive({
					u: 1,
					origin,
					technique: techniqueFor({ isTrueNight, side: info.side }),
					focalDepth: 0.5,
					blurStrength: blurStrengthFor(isTrueNight, BASE_DIVE_BLUR),
				});
			} else {
				// Close branch: only teardown if a dive is actually live. Scrolling
				// during the 760ms exit window must NOT restart this path.
				if (!diveActiveRef.current) return;
				if (diveExitTimerRef.current) {
					clearTimeout(diveExitTimerRef.current);
					diveExitTimerRef.current = null;
				}
				// Keep the OPEN-time origin: the return must zoom out around the same
				// focal point it zoomed into. Re-reading the trigger rect here caught
				// the mid-recede main-shell (transformed/offscreen) and jumped
				// --dive-origin, flashing the void edge before settling. Window scroll
				// is frozen while a subpage is open, so the open origin stays valid.
				setDive((prev) => (prev ? { ...prev, u: 0 } : prev));
				diveActiveRef.current = false;
				diveExitTimerRef.current = setTimeout(() => {
					document.body.classList.remove("dive-active");
					setDive(undefined);
					diveExitTimerRef.current = null;
				}, DIVE_DURATION_MS);
			}
		},
		[],
	);

	useEffect(() => {
		return () => {
			if (diveExitTimerRef.current) clearTimeout(diveExitTimerRef.current);
			document.body.classList.remove("dive-active");
		};
	}, []);

	// In-app same-page anchor clicks (nav, hero, inline topic links) arm smooth
	// scrolling for the gesture; the browser's native fragment scroll then runs
	// smooth (honoring scroll-margin, focus, and history exactly as before). We
	// only arm - never preventDefault - so nothing about the native navigation
	// changes. Cold loads and back/forward restoration never pass through here,
	// so they keep the instant default.
	useEffect(() => {
		const onClick = (e: MouseEvent) => {
			if (shouldArmSmoothForClick(e)) armSmoothScroll();
		};
		document.addEventListener("click", onClick);
		return () => document.removeEventListener("click", onClick);
	}, []);

	// The design composition, pushed up from <DesignModeHost>. Seeded to the
	// deterministic defaults so the server and the first client paint render the
	// SAME composition - no hydration mismatch, and the band is at its settled
	// height from first paint (no baseline-then-swap growth after scroll
	// restoration). This composed look is the default that ships to production;
	// the panel stays mounted for live A/B tweaking.
	const [designComposer, setDesignComposer] =
		useState<ComposerState>(DEFAULT_STATE);

	// The scroll journey. The driver owns every scroll-linked value in the scene:
	// it samples the maths once per animation frame and writes the results
	// straight onto the elements that consume them, so the whole day/night
	// journey costs zero React renders. React state below carries only the
	// SETTLED position, for the handful of things that genuinely need a render
	// (the night UI flip, the atmosphere dial readout).
	const onSettle = useCallback((progress: number) => {
		scrollProgressRef.current = progress;
		setScrollProgress(progress);
	}, []);
	const journey = useScrollJourney({
		celestial,
		anchors: paletteAnchors,
		sliceFor,
		frozenRef: panelOpenRef,
		onSettle,
	});
	// onPanelChange is []-stable by design (a changing identity re-fired the dive
	// close); it reaches the driver through this ref instead of a dependency.
	journeyRef.current = journey;

	// Seed the journey (and the React mirror of it) from a given scroll offset.
	// Callers pass window.scrollY for anchors/restoration, or a parked topic's
	// offsetTop for a subpage whose window hasn't scrolled there yet.
	const seedSkyAt = useCallback(
		(y: number) => {
			// Freeze the driver while a detail subpage is open - the subpage's own
			// scroll must not advance the time of day.
			if (panelOpenRef.current) return;
			const { progress } = journey.applyAt(y);
			scrollProgressRef.current = progress;
			setScrollProgress(progress);
		},
		[journey],
	);

	// Seed React sky state BEFORE the first post-hydration paint so it matches
	// where the boot script already landed the scroll + sky. The boot script
	// (skyBoot.ts) is the single owner of cold-entry scroll for anchors; here we
	// only mirror the resulting position into React. A subpage's window hasn't
	// scrolled (onPanelChange owns that), so seed from its parked topic's offset;
	// an anchor or plain load seeds from the already-landed window scroll.
	useIsomorphicLayoutEffect(() => {
		const entry = coldEntryFor(window.location.pathname, window.location.hash);
		if (entry.mode === "subpage") {
			const el = document.getElementById(entry.topicId);
			if (el) seedSkyAt(el.offsetTop);
			return;
		}
		seedSkyAt(window.scrollY);
	}, [seedSkyAt]);

	// Drop the pre-hydration boot flag once React has COMMITTED the settled state.
	// The boot script sets html.panel-boot for a cold deep entry so the panel and
	// the whole celestial scene render at their resulting state with no transition
	// (see the html.panel-boot rules in styles.css). We must not re-enable
	// transitions until the parked scrollProgress has painted: the cold-entry seed
	// (onPanelChange / the layout-effect seed) settles it a render or two after
	// mount, and re-enabling too early lets that final day->night re-seed animate -
	// the exact flash we're removing. A double rAF clears the class two frames
	// later, well past the settle, so later user-driven navigation still animates.
	useEffect(() => {
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				document.documentElement.classList.remove("panel-boot");
			});
		});
	}, []);

	// A rhythm-gap change (the dev Tune panel slider) moves the document height
	// under a stationary scroll position - no scroll event fires, so re-seed from
	// the current scroll (seedSkyAt re-derives progress against the new height and
	// keeps its own subpage-open freeze).
	// biome-ignore lint/correctness/useExhaustiveDependencies: celestial.gapVh is the trigger; seedSkyAt is stable
	useEffect(() => {
		seedSkyAt(window.scrollY);
	}, [celestial.gapVh]);

	useEffect(() => {
		if (!aboutOpen) return;
		const onPointerDown = (e: PointerEvent) => {
			if (!aboutMenuRef.current?.contains(e.target as Node))
				setAboutOpen(false);
		};
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") setAboutOpen(false);
		};
		document.addEventListener("pointerdown", onPointerDown);
		document.addEventListener("keydown", onKey);
		return () => {
			document.removeEventListener("pointerdown", onPointerDown);
			document.removeEventListener("keydown", onKey);
		};
	}, [aboutOpen]);

	// The sky/celestial scene follows the toy's time-slice override when one is
	// set; otherwise it tracks real scroll. Only the sky-facing values use this -
	// scroll position, watermark, and dive keep raw scroll.
	const skyProgress =
		playground.time != null
			? softSlice(playground.time, scrollProgress)
			: scrollProgress;
	const paletteVisuals = paletteVisualsFor(playground.palette);
	const isNight = skyProgress >= NIGHT_UI_THRESHOLD;
	const navColor = isNight ? "white" : "#0f172a";
	const aboutItemClass = `block px-4 py-2 text-sm font-black uppercase tracking-widest transition-colors ${isNight ? "hover:bg-white hover:text-slate-900" : "hover:bg-slate-900 hover:text-white"}`;

	return (
		<div className="font-sans text-slate-900 selection:bg-yellow-200">
			<PixelBackground
				journey={journey}
				dive={dive}
				landscapeColor={paletteVisuals.landscape}
				sunColor={paletteVisuals.sun}
				extras={playground.extras}
			/>
			<NarrativeWatermark
				journey={journey}
				override={subpageKey ? SUBPAGE_WORDS[subpageKey] : undefined}
				isNight={isNight}
			/>
			{subpageKey === null && (
				<Minimap
					journey={journey}
					celestial={celestial}
					anchors={paletteAnchors}
				/>
			)}

			{/* Dev authoring tools - dev servers only. The visitor-facing Atmosphere
			    toy replaces them in production; here Tune stacks above the Design
			    selector in the bottom-right dev cluster so both clear the toy dial
			    (bottom-left) and the minimap (md:right-24). */}
			{import.meta.env.DEV && (
				<button
					type="button"
					onClick={(e) => {
						lastTriggerRef.current = e.currentTarget;
						setSkyOpen(true);
					}}
					aria-label="Tune sky animation"
					className="fixed bottom-20 right-4 md:right-24 z-50 bg-slate-900 text-white min-h-[44px] px-3 py-3 border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.4)] font-black uppercase text-xs tracking-widest hover:-translate-y-0.5 transition-transform"
				>
					Tune ☀ ☾
				</button>
			)}

			{import.meta.env.DEV && (
				<DesignModeHost
					lastTriggerRef={lastTriggerRef}
					onComposer={setDesignComposer}
				/>
			)}

			<nav
				ref={navRef}
				className="fixed top-0 left-0 right-0 md:right-20 z-50 px-6 py-4 flex justify-between items-center backdrop-blur-sm bg-white/10 border-b border-white/20"
			>
				<a
					href="/"
					onClick={handleScrollTopClick}
					className="text-xl font-black tracking-tighter uppercase flex items-center gap-2 drop-shadow-md transition-colors duration-100 hover:opacity-70"
					style={{ color: navColor }}
				>
					<img
						src="/alper-avatar-64.webp"
						alt=""
						aria-hidden="true"
						width={32}
						height={32}
						className="w-8 h-8 rounded-full border-2 border-slate-900 object-cover shrink-0"
					/>
					Alper Ortac
				</a>
				<div
					className="hidden md:flex gap-8 font-bold text-sm uppercase tracking-widest drop-shadow-sm transition-colors duration-100 items-center"
					style={{ color: navColor }}
				>
					<a
						href="/"
						onClick={handleScrollTopClick}
						className="hover:opacity-70 transition-colors"
					>
						Start
					</a>
					<div className="relative" ref={aboutMenuRef}>
						<button
							type="button"
							id="about-menu-trigger"
							onClick={() => setAboutOpen((v) => !v)}
							aria-expanded={aboutOpen}
							aria-controls="about-menu"
							className="hover:opacity-70 transition-colors uppercase tracking-widest font-bold text-sm flex items-center gap-1"
						>
							About Me
							<ChevronDown
								size={14}
								strokeWidth={3}
								className={`transition-transform duration-150 ${aboutOpen ? "rotate-180" : ""}`}
								aria-hidden="true"
							/>
						</button>
						{aboutOpen && (
							<div
								id="about-menu"
								role="menu"
								aria-labelledby="about-menu-trigger"
								className={`absolute top-full right-0 mt-2 min-w-[220px] border-2 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.25)] py-2 ${isNight ? "bg-slate-900 border-white text-white" : "bg-white border-slate-900 text-slate-900"}`}
							>
								<a
									href={`#${SECTION_IDS.findMe}`}
									onClick={() => setAboutOpen(false)}
									className={aboutItemClass}
								>
									Socials
								</a>
								<a
									href={`#${SECTION_IDS.projects}`}
									onClick={() => setAboutOpen(false)}
									className={aboutItemClass}
								>
									Projects
								</a>
								{TOPICS.map((topic) => (
									<a
										key={topic.id}
										href={`#${topic.id}`}
										onClick={() => setAboutOpen(false)}
										className={aboutItemClass}
									>
										{topic.heading}
									</a>
								))}
							</div>
						)}
					</div>
					<a
						href={`#${SECTION_IDS.contact}`}
						className="hover:opacity-70 transition-colors"
					>
						Contact
					</a>
				</div>
				<div className="flex items-center gap-4">
					<a
						href={`#${SECTION_IDS.findMe}`}
						className={`p-2 px-4 font-bold text-sm transition-all active:scale-95 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] duration-100 ${isNight ? "bg-white text-slate-900 hover:bg-slate-200" : "bg-slate-900 text-white hover:bg-slate-800"}`}
					>
						Follow Me
					</a>
				</div>
			</nav>

			<div
				ref={mainShellRef}
				className={`main-shell min-h-screen md:pr-20${subpageKey ? " main-shell--subpage" : ""}`}
			>
				<HeroSection />
				<RhythmGap gapVh={celestial.gapVh} />
				<FindMeSection />
				<RhythmGap gapVh={celestial.gapVh} />
				<ProjectsSection lastTriggerRef={lastTriggerRef} />
				<RhythmGap gapVh={celestial.gapVh} />
				<CraftSection
					lastTriggerRef={lastTriggerRef}
					isNight={isNight}
					composer={designComposer}
					gapVh={celestial.gapVh}
				/>
				<RhythmGap gapVh={celestial.gapVh} />
				<FooterSection />
			</div>

			<PanelHost
				skyOpen={skyOpen}
				setSkyOpen={setSkyOpen}
				celestial={celestial}
				setCelestial={setCelestial}
				lastTriggerRef={lastTriggerRef}
				onPanelChange={onPanelChange}
				navRef={navRef}
				mainShellRef={mainShellRef}
			/>

			{/* The always-on atmospheric-playground toy (visitor sky toy). */}
			<AtmosphereToy
				playground={playground}
				api={playgroundApi}
				live={skyProgress}
				isNight={isNight}
			/>

			{/* Outlet must be rendered so child routes are matched by useMatches; children render null */}
			<div style={{ display: "none" }} aria-hidden="true">
				<Outlet />
			</div>

			<style
				// biome-ignore lint/security/noDangerouslySetInnerHtml: scoped keyframes for pixel ambient animations
				dangerouslySetInnerHTML={{
					__html: `
						/* Instant by default so cold entry (fresh load / reload landing
						   on a #anchor or subpage) and back/forward restoration jump
						   straight to the target with no visible travel. In-app clicks
						   arm .smooth-scroll for the gesture (see armSmoothScroll); the
						   opt-in is gated behind prefers-reduced-motion so reduced-motion
						   users stay instant everywhere. */
						@media (prefers-reduced-motion: no-preference) {
							html.smooth-scroll { scroll-behavior: smooth; }
						}
						#craft article, #socials, #projects, #contact { scroll-margin-top: 80px; }
						.cursor-pixel { cursor: crosshair; }
						::selection {
							background: #fef08a;
							color: #000;
						}
						@keyframes twinkle {
							0%, 100% { opacity: 0.1; transform: scale(0.8); }
							50% { opacity: 1; transform: scale(1.2); }
						}
						.animate-twinkle {
							animation-name: twinkle;
							animation-iteration-count: infinite;
							animation-timing-function: ease-in-out;
						}
						@keyframes shooting-star {
							0% { transform: translateX(0) translateY(0) rotate(-35deg); opacity: 1; }
							100% { transform: translateX(-1500px) translateY(1000px) rotate(-35deg); opacity: 0; }
						}
						.animate-shooting-star {
							animation-name: shooting-star;
							animation-iteration-count: infinite;
							animation-timing-function: linear;
							animation-duration: 5s;
						}
						/* Cloud drift is wrap: full crossings at constant per-element
						   speed on the CSS clock (wall clock, wayfinder #78), so cloud
						   motion survives an open subpage (#60 invariant). Animates the
						   element's translate; the driver's sink writes translate on
						   the LAYER, so the two never meet. */
						@keyframes cloud-wrap {
							from { translate: -45vw 0; }
							to { translate: 110vw 0; }
						}
						.cloud-el {
							animation: cloud-wrap var(--wdur, 100s) linear var(--wdel, 0s) infinite;
							transition: opacity 900ms ease;
						}
						.cloud-el.scene-off { opacity: 0; }
						.star-el.scene-off { visibility: hidden; }
						/* Bird flights (wayfinder #64): a flight wrapper crosses the
						   sky on the wall clock like the clouds, so bird motion
						   survives an open subpage (#60). A reversed flight plays the
						   same crossing backwards and mirrors its sprites, so every
						   bird flies beak-first. The vertical path (bob/swoop)
						   composes inside the crossing; the wingbeat keyframes are
						   generated per species (see PixelBackground). */
						@keyframes bird-cross {
							from { translate: -18vw 0; }
							to { translate: 118vw 0; }
						}
						.bird-flight {
							animation: bird-cross var(--bdur, 60s) linear var(--bdel, 0s) infinite;
							transition: opacity 900ms ease;
						}
						.bird-flight--rev { animation-direction: reverse; }
						.bird-flight--rev .bird-el { transform: scaleX(-1); }
						/* Deactivated flights fade 900ms then pause (#61 pattern);
						   display:none would pop a whole flock out (#80). The child
						   pause matters here: poses and path wrappers animate too. */
						.bird-flight.scene-off { opacity: 0; }
						.bird-flight.scene-off * { animation-play-state: paused; }
						@keyframes bird-bob {
							0%, 100% { translate: 0 0; }
							50% { translate: 0 calc(-1 * var(--amp, 2vh)); }
						}
						.bird-path-bob {
							animation: bird-bob var(--pdur, 4s) ease-in-out var(--pdel, 0s) infinite;
						}
						@keyframes bird-swoop {
							0% { translate: 0 0; }
							30% { translate: 0 calc(-1 * var(--amp, 2vh)); }
							55% { translate: 0 calc(var(--amp, 2vh) * 0.35); }
							100% { translate: 0 0; }
						}
						.bird-path-swoop {
							animation: bird-swoop var(--pdur, 4s) ease-in-out var(--pdel, 0s) infinite;
						}
						.bird-pose { opacity: 0; }
						/* Prefix activation (#61): an inactive pool element is paused,
						   not just hidden - a paused animation leaves the style budget,
						   where opacity: 0 alone buys nothing. Declared after .cloud-el
						   so paused beats the shorthand's running. */
						.scene-off { animation-play-state: paused; }
						/* The atmosphere toy's dense-stars override wins over the
						   schedule, like forceShoot does for the shooting stars. */
						.stars-dense .star-el.scene-off {
							visibility: visible;
							animation-play-state: running;
						}
						@media (prefers-reduced-motion: reduce) {
							/* Look-and-feel brief (#77): terrain and vapors freeze,
							   creatures are removed. A frozen shooting star is a stuck
							   streak, so it hides instead. */
							.animate-twinkle, .cloud-el { animation: none; }
							.animate-shooting-star { animation: none; opacity: 0; }
							.bird-layer { display: none; }
						}
					`,
				}}
			/>
		</div>
	);
}
