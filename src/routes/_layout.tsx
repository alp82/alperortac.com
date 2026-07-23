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
import { RhythmGap } from "../components/_layout/RhythmGap";
import { Minimap } from "../components/Minimap";
import { NarrativeWatermark } from "../components/NarrativeWatermark";
import { SUBPAGE_WORDS } from "../components/narrativeWatermark";
import { PixelBackground } from "../components/PixelBackground";
import { useIsomorphicLayoutEffect } from "../components/useIsomorphicLayoutEffect";
import {
	CELESTIAL_STORAGE_KEY,
	type CelestialState,
	DEFAULT_CELESTIAL,
} from "../data/celestial";
import {
	armSmoothScroll,
	handleScrollTopClick,
	type PanelKey,
	SECTION_IDS,
	shouldArmSmoothForClick,
} from "../data/sections";
import { coldEntryFor } from "../data/skyBoot";
import {
	DEFAULT_SKY_CURVE,
	NIGHT_UI_THRESHOLD,
	type SkyCurve,
	scrollProgressAt,
	skyAt,
} from "../data/skyCurve";
import { PANEL_KEY_TO_TOPIC_ID, TOPICS } from "../data/topics";
// The atmospheric-playground toy (#38 / #32): the always-on visitor sky toy.
import {
	AtmosphereToy,
	paletteAnchorsFor,
	paletteVisualsFor,
	softSlice,
	usePlayground,
} from "../components/_layout/playground/AtmosphereToy";

export const Route = createFileRoute("/_layout")({ component: LayoutHost });

function isValidCurve(v: unknown): v is SkyCurve {
	return (
		typeof v === "object" &&
		v !== null &&
		typeof (v as SkyCurve).enabled === "boolean" &&
		Array.isArray((v as SkyCurve).phase1) &&
		(v as SkyCurve).phase1.length === 2 &&
		Array.isArray((v as SkyCurve).phase2) &&
		(v as SkyCurve).phase2.length === 2 &&
		typeof (v as SkyCurve).boost === "number"
	);
}

function useCelestialState(): [CelestialState, (s: CelestialState) => void] {
	const [state, setState] = useState<CelestialState>(DEFAULT_CELESTIAL);
	const writeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		try {
			const stored = localStorage.getItem(CELESTIAL_STORAGE_KEY);
			if (!stored) return;
			const parsed = JSON.parse(stored) as Partial<CelestialState>;
			if (parsed?.sun && parsed?.moon) {
				// Migration shims: older states stored before sky-curve landed lack
				// `curve`; states stored before vertical rhythm landed lack `gapVh`.
				setState({
					sun: parsed.sun,
					moon: parsed.moon,
					curve: isValidCurve(parsed.curve) ? parsed.curve : DEFAULT_SKY_CURVE,
					gapVh:
						typeof parsed.gapVh === "number"
							? parsed.gapVh
							: DEFAULT_CELESTIAL.gapVh,
				});
			}
		} catch {
			// localStorage may be unavailable (SSR / private mode)
		}
	}, []);

	useEffect(() => {
		return () => {
			if (writeTimerRef.current) clearTimeout(writeTimerRef.current);
		};
	}, []);

	const update = (next: CelestialState) => {
		setState(next);
		if (writeTimerRef.current) clearTimeout(writeTimerRef.current);
		writeTimerRef.current = setTimeout(() => {
			try {
				localStorage.setItem(CELESTIAL_STORAGE_KEY, JSON.stringify(next));
			} catch {
				// localStorage may be unavailable
			}
		}, 200);
	};

	return [state, update];
}

function LayoutHost() {
	const [scrollProgress, setScrollProgress] = useState(0);
	const [scrollY, setScrollY] = useState(0);
	const [celestial, setCelestial] = useCelestialState();
	// Mirror of celestial for the pre-paint seed (a []-dep layout effect that
	// must read the current curve without re-subscribing). Synced in an effect,
	// not during render, so concurrent rendering can't observe a torn value.
	const celestialRef = useRef(celestial);
	useEffect(() => {
		celestialRef.current = celestial;
	}, [celestial]);
	// Atmosphere toy state (time-slice override + palette + extras). Held in a ref
	// too so the []-dep sky painters can read it without resubscribing.
	const [playground, playgroundApi] = usePlayground();
	const playgroundRef = useRef(playground);
	useEffect(() => {
		playgroundRef.current = playground;
	}, [playground]);
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
						const progress = scrollProgressAt(
							targetY,
							document.documentElement.scrollHeight,
							window.innerHeight,
						);
						scrollProgressRef.current = progress;
						setScrollProgress(progress);
						setScrollY(targetY);
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

	// Paint the sky for the current progress: the body background (the void the
	// dive's 3D transform can expose at the landscape edges) and the --sky-now
	// custom property that PixelBackground's base layer reads. React owns
	// --sky-now after hydration; the pre-hydration boot script (skyBoot.ts) sets
	// it for the first frame. Frozen while a subpage is open.
	// Paint the sky for a RAW scroll progress, applying the atmosphere toy's soft
	// time-slice override + palette anchors when active. Both paint sites (this
	// reactive effect and seedSkyAt's pre-paint) route through here so they always
	// agree. Reads refs so it stays []-stable.
	const paintSky = useCallback((rawProgress: number) => {
		const pg = playgroundRef.current;
		const eff = pg.time != null ? softSlice(pg.time, rawProgress) : rawProgress;
		const anchors = paletteAnchorsFor(pg.palette);
		const color = skyAt(eff, celestialRef.current.curve, anchors);
		document.body.style.backgroundColor = color;
		document.documentElement.style.setProperty("--sky-now", color);
	}, []);
	// biome-ignore lint/correctness/useExhaustiveDependencies: celestial + playground are repaint triggers - paintSky reads them via refs, so a palette/time/curve change must re-run this effect to recolour --sky-now without waiting for a scroll.
	useEffect(() => {
		paintSky(scrollProgress);
	}, [scrollProgress, celestial, playground, paintSky]);

	// Own the RhythmGap height var for Tune-panel changes. The boot script already
	// set --gap-vh from stored localStorage before paint; useCelestialState loads
	// that same value in a passive effect, so on the FIRST commit celestial.gapVh
	// is still the DEFAULT. Writing it here on mount would stomp the boot's stored
	// value with the default (a 40->55->40 reflow for tuned-gap users), so skip
	// the first run and only react to genuine post-mount changes.
	const gapVhMountedRef = useRef(false);
	useEffect(() => {
		if (!gapVhMountedRef.current) {
			gapVhMountedRef.current = true;
			return;
		}
		document.documentElement.style.setProperty(
			"--gap-vh",
			`${celestial.gapVh}vh`,
		);
	}, [celestial.gapVh]);

	// Seed the day/night driver (and the sky it paints) from a given scroll
	// offset. Callers pass window.scrollY for anchors/restoration, or a parked
	// topic's offsetTop for a subpage whose window hasn't scrolled there yet.
	const seedSkyAt = useCallback((y: number) => {
		// Freeze the driver while a detail subpage is open - the subpage's own
		// scroll must not advance the time of day.
		if (panelOpenRef.current) return;
		const progress = scrollProgressAt(
			y,
			document.documentElement.scrollHeight,
			window.innerHeight,
		);
		scrollProgressRef.current = progress;
		setScrollProgress(progress);
		setScrollY(y);
		// Paint immediately so the pre-paint seed leaves no default-day frame
		// before the reactive effect above catches up. paintSky applies any
		// active atmosphere-toy override/palette.
		paintSky(progress);
	}, [paintSky]);

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

	// Track scrolling after the initial seed.
	useEffect(() => {
		const onScroll = () => seedSkyAt(window.scrollY);
		window.addEventListener("scroll", onScroll);
		return () => {
			window.removeEventListener("scroll", onScroll);
		};
	}, [seedSkyAt]);

	// A rhythm-gap change (Tune panel slider, or the stored gap loading after
	// mount) moves the document height under a stationary scroll position - no
	// scroll event fires, so re-seed from the current scroll (seedSkyAt re-derives
	// progress against the new height and keeps its own subpage-open freeze).
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
	const paletteAnchors = paletteAnchorsFor(playground.palette);
	const paletteVisuals = paletteVisualsFor(playground.palette);
	const isNight = skyProgress >= NIGHT_UI_THRESHOLD;
	const navColor = isNight ? "white" : "#0f172a";
	const aboutItemClass = `block px-4 py-2 text-sm font-black uppercase tracking-widest transition-colors ${isNight ? "hover:bg-white hover:text-slate-900" : "hover:bg-slate-900 hover:text-white"}`;

	return (
		<div className="font-sans text-slate-900 selection:bg-yellow-200">
			<PixelBackground
				scrollProgress={skyProgress}
				celestial={celestial}
				dive={dive}
				landscapeColor={paletteVisuals.landscape}
				sunColor={paletteVisuals.sun}
				extras={playground.extras}
			/>
			<NarrativeWatermark
				scrollProgress={scrollProgress}
				scrollY={scrollY}
				override={subpageKey ? SUBPAGE_WORDS[subpageKey] : undefined}
				isNight={isNight}
			/>
			{subpageKey === null && (
				<Minimap
					scrollProgress={skyProgress}
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
						#craft article, #socials, #contact { scroll-margin-top: 80px; }
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
					`,
				}}
			/>
		</div>
	);
}
