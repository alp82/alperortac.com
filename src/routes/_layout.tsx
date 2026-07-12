import { createFileRoute, Outlet } from "@tanstack/react-router";
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
import { PanelHost } from "../components/_layout/PanelHost";
import { Minimap } from "../components/Minimap";
import { NarrativeWatermark } from "../components/NarrativeWatermark";
import { SUBPAGE_WORDS } from "../components/narrativeWatermark";
import { PixelBackground } from "../components/PixelBackground";
import { type CelestialState, DEFAULT_CELESTIAL } from "../data/celestial";
import {
	handleScrollTopClick,
	type PanelKey,
	SECTION_IDS,
} from "../data/sections";
import {
	DEFAULT_SKY_CURVE,
	NIGHT_UI_THRESHOLD,
	type SkyCurve,
	scrollProgressAt,
	skyAt,
} from "../data/skyCurve";
import { PANEL_KEY_TO_TOPIC_ID, TOPICS } from "../data/topics";

export const Route = createFileRoute("/_layout")({ component: LayoutHost });

const CELESTIAL_STORAGE_KEY = "alp-celestial-v1";

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
				// Migration shim: older states stored before sky-curve landed lack `curve`.
				setState({
					sun: parsed.sun,
					moon: parsed.moon,
					curve: isValidCurve(parsed.curve) ? parsed.curve : DEFAULT_SKY_CURVE,
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
	const [skyOpen, setSkyOpen] = useState(false);
	const [aboutOpen, setAboutOpen] = useState(false);
	const aboutMenuRef = useRef<HTMLDivElement | null>(null);
	const lastTriggerRef = useRef<HTMLElement | null>(null);
	const navRef = useRef<HTMLElement | null>(null);
	const mainShellRef = useRef<HTMLDivElement | null>(null);
	const [dive, setDive] = useState<DiveRenderState | undefined>(undefined);
	const [subpageKey, setSubpageKey] = useState<PanelKey | null>(null);
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
			setSubpageKey(info.key);
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
				// is open (panelOpenRef short-circuits handleScroll), so after the
				// programmatic scroll we update scrollProgress/scrollY ourselves.
				if (rect == null) {
					const topicId = PANEL_KEY_TO_TOPIC_ID[info.key];
					const el = topicId ? document.getElementById(topicId) : null;
					if (el) {
						// Compute progress from the TARGET offset, not the post-scroll
						// window.scrollY: with scroll-behavior:smooth the programmatic
						// scroll is async, so reading scrollY here is stale (0) and the
						// sky would stay day while the scroll animates to the right spot.
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
				}
				const origin = rect
					? `${((rect.left + rect.width / 2) / window.innerWidth) * 100}% ${
							((rect.top + rect.height / 2) / window.innerHeight) * 100
						}%`
					: "50% 50%";
				document.body.classList.add("dive-active");
				diveActiveRef.current = true;
				const isTrueNight =
					scrollProgressRef.current >= TRUE_NIGHT_DIVE_THRESHOLD;
				setDive({
					u: 1,
					origin,
					// When opened via direct URL (no trigger rect), use glide so no
					// side-pitched swoop arrives from a side that was never clicked.
					technique: rect
						? techniqueFor({ isTrueNight, side: info.side })
						: "glide",
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

	// The design composition, pushed up from <DesignModeHost>. Seeded to the
	// deterministic defaults so the server and the first client paint render the
	// SAME composition - no hydration mismatch, and the band is at its settled
	// height from first paint (no baseline-then-swap growth after scroll
	// restoration). This composed look is the default that ships to production;
	// the panel stays mounted for live A/B tweaking.
	const [designComposer, setDesignComposer] =
		useState<ComposerState>(DEFAULT_STATE);

	// Paint the body background with the current sky color so the dive's 3D
	// transform never reveals a white void at the landscape edges - any exposed
	// edge matches the sky/time-of-day (frozen while a subpage is open).
	useEffect(() => {
		document.body.style.backgroundColor = skyAt(
			scrollProgress,
			celestial.curve,
		);
	}, [scrollProgress, celestial]);

	useEffect(() => {
		const handleScroll = () => {
			// Freeze the day/night driver while a detail subpage is open - the
			// subpage's own scroll must not advance the time of day.
			if (panelOpenRef.current) return;
			const winHeight = window.innerHeight;
			const docHeight = document.documentElement.scrollHeight;
			const currentScroll = window.scrollY;
			const progress = scrollProgressAt(currentScroll, docHeight, winHeight);
			scrollProgressRef.current = progress;
			setScrollProgress(progress);
			setScrollY(currentScroll);
		};

		// Seed the sky from the browser's restored scroll position once on mount,
		// then track scrolling. The composition now SSRs at its settled height, so
		// the document height is stable from first paint - the seed reads the right
		// fraction in one shot and no height-change recompute (ResizeObserver /
		// resize) is needed to correct it.
		handleScroll();
		window.addEventListener("scroll", handleScroll);
		return () => {
			window.removeEventListener("scroll", handleScroll);
		};
	}, []);

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

	const isNight = scrollProgress >= NIGHT_UI_THRESHOLD;
	const navColor = isNight ? "white" : "#0f172a";
	const aboutItemClass = `block px-4 py-2 text-sm font-black uppercase tracking-widest transition-colors ${isNight ? "hover:bg-white hover:text-slate-900" : "hover:bg-slate-900 hover:text-white"}`;

	return (
		<div className="font-sans text-slate-900 selection:bg-yellow-200">
			<PixelBackground
				scrollProgress={scrollProgress}
				celestial={celestial}
				dive={dive}
			/>
			<NarrativeWatermark
				scrollProgress={scrollProgress}
				scrollY={scrollY}
				override={subpageKey ? SUBPAGE_WORDS[subpageKey] : undefined}
				isNight={isNight}
			/>
			{subpageKey === null && (
				<Minimap scrollProgress={scrollProgress} celestial={celestial} />
			)}

			<button
				type="button"
				onClick={(e) => {
					lastTriggerRef.current = e.currentTarget;
					setSkyOpen(true);
				}}
				aria-label="Tune sky animation"
				className="fixed bottom-4 left-4 z-50 bg-slate-900 text-white min-h-[44px] px-3 py-3 border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.4)] font-black uppercase text-xs tracking-widest hover:-translate-y-0.5 transition-transform"
			>
				Tune ☀ ☾
			</button>

			<DesignModeHost
				lastTriggerRef={lastTriggerRef}
				onComposer={setDesignComposer}
			/>

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

			<div ref={mainShellRef} className="main-shell min-h-screen md:pr-20">
				<HeroSection />
				<FindMeSection />
				<CraftSection
					lastTriggerRef={lastTriggerRef}
					isNight={isNight}
					composer={designComposer}
				/>
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

			{/* Outlet must be rendered so child routes are matched by useMatches; children render null */}
			<div style={{ display: "none" }} aria-hidden="true">
				<Outlet />
			</div>

			<style
				// biome-ignore lint/security/noDangerouslySetInnerHtml: scoped keyframes for pixel ambient animations
				dangerouslySetInnerHTML={{
					__html: `
						html { scroll-behavior: smooth; }
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
