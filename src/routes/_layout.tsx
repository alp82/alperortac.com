import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ChevronDown, Moon, Sun } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Minimap } from "../components/Minimap";
import { PixelBackground } from "../components/PixelBackground";
import type { ComposerState } from "../components/_layout/composer/useComposerControls";
import { CraftSection } from "../components/_layout/CraftSection";
import { CTASection } from "../components/_layout/CTASection";
import { DesignModeHost } from "../components/_layout/DesignModeHost";
import { HeroSection } from "../components/_layout/HeroSection";
import { LinktreeSection } from "../components/_layout/LinktreeSection";
import { PanelHost } from "../components/_layout/PanelHost";
import { type CelestialState, DEFAULT_CELESTIAL } from "../data/celestial";
import { SECTION_IDS } from "../data/sections";
import { DEFAULT_SKY_CURVE, type SkyCurve } from "../data/skyCurve";
import { TOPICS } from "../data/topics";

export const Route = createFileRoute("/_layout")({ component: LayoutHost });

const CELESTIAL_STORAGE_KEY = "alp-celestial-v1";

// Scroll progress at which nav, footer, and section headers invert to white.
// Decoupled from the sky curve so the day→night background timing stays put;
// the dusk sky is still too light for white text right when the night
// transition begins, so the UI flip lands a bit later than the sky shift.
const NIGHT_UI_THRESHOLD = 0.55;

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

// DEV-only design-exploration host. import.meta.env.DEV is a compile-time
// constant, so in production this folds to `false`, the <DesignModeHost> render
// site below becomes dead code, and Rollup tree-shakes the host + its
// transitive imports (panel, hook, approach registry) out of the client
// bundle. Remove once a design is locked (see CLEANUP_NEEDED).
const DESIGN_MODE = import.meta.env.DEV;

function LayoutHost() {
	const [scrollProgress, setScrollProgress] = useState(0);
	const [celestial, setCelestial] = useCelestialState();
	const [skyOpen, setSkyOpen] = useState(false);
	const [aboutOpen, setAboutOpen] = useState(false);
	const aboutMenuRef = useRef<HTMLDivElement | null>(null);
	const lastTriggerRef = useRef<HTMLElement | null>(null);

	// DEV-only design composition, pushed up from <DesignModeHost>. undefined in
	// production (the host never mounts), so the interests band renders the
	// baseline. LayoutHost imports neither the panel nor the hook, keeping them
	// fully strippable.
	const [designComposer, setDesignComposer] = useState<
		ComposerState | undefined
	>(undefined);

	useEffect(() => {
		const handleScroll = () => {
			const winHeight = window.innerHeight;
			const docHeight = document.documentElement.scrollHeight;
			const totalScroll = docHeight - winHeight;
			const currentScroll = window.scrollY;
			const progress =
				totalScroll > 0
					? Math.min(Math.max(currentScroll / totalScroll, 0), 1)
					: 0;
			setScrollProgress(progress);
		};

		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
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
	const currentYear = new Date().getFullYear();
	const aboutItemClass = `block px-4 py-2 text-sm font-black uppercase tracking-widest transition-colors ${isNight ? "hover:bg-white hover:text-slate-900" : "hover:bg-slate-900 hover:text-white"}`;

	return (
		<div className="font-sans text-slate-900 selection:bg-yellow-200">
			<PixelBackground scrollProgress={scrollProgress} celestial={celestial} />
			<Minimap scrollProgress={scrollProgress} celestial={celestial} />

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

			{DESIGN_MODE && (
				<DesignModeHost
					lastTriggerRef={lastTriggerRef}
					onComposer={setDesignComposer}
				/>
			)}

			<nav className="fixed top-0 left-0 right-0 md:right-20 z-50 px-6 py-4 flex justify-between items-center backdrop-blur-sm bg-white/10 border-b border-white/20">
				<div
					className="text-xl font-black tracking-tighter uppercase flex items-center gap-2 drop-shadow-md transition-colors duration-100"
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
				</div>
				<div
					className="hidden md:flex gap-8 font-bold text-sm uppercase tracking-widest drop-shadow-sm transition-colors duration-100 items-center"
					style={{ color: navColor }}
				>
					<a
						href={`#${SECTION_IDS.hero}`}
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
								aria-labelledby="about-menu-trigger"
								className={`absolute top-full right-0 mt-2 min-w-[220px] border-2 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.25)] py-2 ${isNight ? "bg-slate-900 border-white text-white" : "bg-white border-slate-900 text-slate-900"}`}
							>
								<a
									href={`#${SECTION_IDS.linktree}`}
									onClick={() => setAboutOpen(false)}
									className={aboutItemClass}
								>
									Find Me Online
								</a>
								{TOPICS.map((topic) => (
									<a
										key={topic.id}
										href={`#topic-${topic.id}`}
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
						href={`#${SECTION_IDS.cta}`}
						className="hover:opacity-70 transition-colors"
					>
						Contact
					</a>
				</div>
				<div className="flex items-center gap-4">
					<a
						href={`#${SECTION_IDS.linktree}`}
						className={`p-2 px-4 font-bold text-sm transition-all active:scale-95 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] duration-100 ${isNight ? "bg-white text-slate-900 hover:bg-slate-200" : "bg-slate-900 text-white hover:bg-slate-800"}`}
					>
						Follow Me
					</a>
				</div>
			</nav>

			<div className="main-shell min-h-screen md:pr-20">
				<HeroSection />
				<LinktreeSection />
				<CraftSection
					lastTriggerRef={lastTriggerRef}
					isNight={isNight}
					composer={designComposer}
				/>
				<CTASection />

				<footer
					id={SECTION_IDS.footer}
					className="py-12 px-6 border-t border-white/20 bg-slate-900/40 backdrop-blur-md transition-colors duration-100"
					style={{ color: isNight ? "white" : "#0f172a" }}
				>
					<div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
						<div className="font-black uppercase tracking-tighter drop-shadow-sm">
							© {currentYear} ALP — CREATING EVERY DAY
						</div>
						<div className="flex items-center gap-2 text-sm font-bold drop-shadow-sm">
							{scrollProgress < 0.5 ? (
								<Sun size={16} aria-hidden="true" />
							) : (
								<Moon size={16} aria-hidden="true" />
							)}
							PHASE:{" "}
							{scrollProgress < 0.5
								? "DAY"
								: scrollProgress < 0.8
									? "DUSK"
									: "NIGHT"}
						</div>
					</div>
				</footer>
			</div>

			<PanelHost
				skyOpen={skyOpen}
				setSkyOpen={setSkyOpen}
				celestial={celestial}
				setCelestial={setCelestial}
				lastTriggerRef={lastTriggerRef}
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
						[id^="topic-"], #hero, #linktree, #cta { scroll-margin-top: 80px; }
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
