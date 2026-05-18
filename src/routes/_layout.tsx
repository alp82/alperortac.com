import {
	SiBluesky,
	SiGithub,
	SiInstagram,
	SiThreads,
	SiTiktok,
	SiX,
	SiYoutube,
} from "@icons-pack/react-simple-icons";
import {
	createFileRoute,
	Outlet,
	useMatches,
	useNavigate,
} from "@tanstack/react-router";
import {
	ArrowLeft,
	ArrowRight,
	Briefcase,
	Mail,
	MessageCircle,
	Moon,
	Sun,
	Video,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { CAREER_PANEL_TITLE_ID, CareerPanel } from "../components/CareerPanel";
import {
	getProjectPanelTitleId,
	ProjectPanel,
} from "../components/ProjectPanel";
import {
	SKY_PANEL_TITLE_ID,
	SkyTuningPanel,
} from "../components/SkyTuningPanel";
import { type CelestialState, DEFAULT_CELESTIAL } from "../data/celestial";
import { type Project, PROJECT_ICONS, PROJECTS } from "../data/projects";
import {
	MINIMAP_BOUNDARIES,
	PANEL_SIDES,
	type PanelKey,
	SECTION_IDS,
} from "../data/sections";

export const Route = createFileRoute("/_layout")({ component: LayoutHost });

type BrandIcon = React.ComponentType<{
	size?: number;
	color?: string;
	className?: string;
}>;

// LinkedIn was removed from Simple Icons and Lucide over trademark requests;
// nominative-use glyph for linking out to a profile.
function SiLinkedin({
	size = 24,
	color = "default",
	className,
}: {
	size?: number;
	color?: string;
	className?: string;
}) {
	const fill = color === "default" ? "#0A66C2" : color || "currentColor";
	return (
		<svg
			viewBox="0 0 24 24"
			width={size}
			height={size}
			fill={fill}
			className={className}
			xmlns="http://www.w3.org/2000/svg"
			role="img"
			aria-label="LinkedIn"
		>
			<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.852 3.37-1.852 3.601 0 4.267 2.37 4.267 5.455v6.288zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.063 2.063 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
		</svg>
	);
}

type SocialLinkData = { label: string; href?: string; Icon: BrandIcon };

type SocialGroup = {
	title: string;
	Icon: React.ComponentType<{ size: number }>;
	links: SocialLinkData[];
};

const SOCIAL_GROUPS: SocialGroup[] = [
	{
		title: "Video",
		Icon: Video,
		links: [
			{
				label: "YouTube",
				href: "https://www.youtube.com/@AlperTheOrtac",
				Icon: SiYoutube,
			},
			{
				label: "TikTok",
				href: "https://www.tiktok.com/@alperortac",
				Icon: SiTiktok,
			},
			{
				label: "Instagram",
				href: "https://www.instagram.com/alper.the.ortac/",
				Icon: SiInstagram,
			},
		],
	},
	{
		title: "Posts",
		Icon: MessageCircle,
		links: [
			{ label: "X (Twitter)", href: "https://x.com/alperortac", Icon: SiX },
			{
				label: "Threads",
				href: "https://www.threads.com/@alper.the.ortac",
				Icon: SiThreads,
			},
			{
				label: "Bluesky",
				href: "https://bsky.app/profile/alperortac.bsky.social",
				Icon: SiBluesky,
			},
		],
	},
	{
		title: "Code",
		Icon: Briefcase,
		links: [
			{ label: "GitHub", href: "https://github.com/alp82", Icon: SiGithub },
			{
				label: "LinkedIn",
				href: "https://www.linkedin.com/in/alper-ortac-b8319549/",
				Icon: SiLinkedin,
			},
		],
	},
];

const SOCIAL_LINK_CLASS =
	"flex items-center justify-between w-full text-left group p-3 border-2 border-slate-900 transition-all font-bold uppercase tracking-wider";

function SocialLink({ label, href, Icon }: SocialLinkData) {
	const body = (
		<>
			<span className="flex items-center gap-3 min-w-0">
				<span className="w-9 h-9 flex items-center justify-center bg-white border-2 border-slate-900 shrink-0">
					<Icon size={18} color="default" />
				</span>
				<span className="truncate">{label}</span>
			</span>
			<ArrowRight
				size={16}
				className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
			/>
		</>
	);

	if (href) {
		return (
			<a
				href={href}
				target="_blank"
				rel="noopener noreferrer"
				className={`${SOCIAL_LINK_CLASS} bg-white/80 hover:bg-slate-900 hover:text-white`}
			>
				{body}
			</a>
		);
	}

	return (
		<button
			type="button"
			disabled
			aria-disabled="true"
			className={`${SOCIAL_LINK_CLASS} opacity-60 cursor-not-allowed`}
		>
			{body}
		</button>
	);
}

const SUN_WINDOW = { start: 0, end: 0.65 };
const MOON_WINDOW = { start: 0.45, end: 1.0 };
const CELESTIAL_STORAGE_KEY = "alp-celestial-v1";

function windowedProgress(p: number, win: { start: number; end: number }) {
	const range = win.end - win.start;
	if (range <= 0) return 0;
	return Math.min(Math.max((p - win.start) / range, 0), 1);
}

function celestialPosition(
	localProgress: number,
	params: CelestialState["sun"],
) {
	const x = params.startX + (params.endX - params.startX) * localProgress;
	const yLinear = params.startY + (params.endY - params.startY) * localProgress;
	const y = yLinear - Math.sin(localProgress * Math.PI) * params.arcLift;
	return { x, y };
}

function useCelestialState(): [CelestialState, (s: CelestialState) => void] {
	const [state, setState] = useState<CelestialState>(DEFAULT_CELESTIAL);

	useEffect(() => {
		try {
			const stored = localStorage.getItem(CELESTIAL_STORAGE_KEY);
			if (!stored) return;
			const parsed = JSON.parse(stored) as CelestialState;
			if (parsed?.sun && parsed?.moon) setState(parsed);
		} catch {
			// localStorage may be unavailable (SSR / private mode)
		}
	}, []);

	const update = (next: CelestialState) => {
		setState(next);
		try {
			localStorage.setItem(CELESTIAL_STORAGE_KEY, JSON.stringify(next));
		} catch {
			// localStorage may be unavailable
		}
	};

	return [state, update];
}

function Stars({ scrollProgress }: { scrollProgress: number }) {
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

	const opacity = Math.max(0, (scrollProgress - 0.5) * 2);

	return (
		<div
			className="absolute inset-0 overflow-hidden pointer-events-none transition-opacity duration-700 ease-in-out"
			style={{ opacity }}
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

function PixelBackground({
	scrollProgress,
	celestial,
}: {
	scrollProgress: number;
	celestial: CelestialState;
}) {
	const getInterpolatedColor = (p: number) => {
		const noon = { r: 135, g: 206, b: 235 };
		const dusk = { r: 244, g: 164, b: 96 };
		const night = { r: 20, g: 10, b: 50 };

		let r: number;
		let g: number;
		let b: number;

		if (p < 0.5) {
			const localP = p * 2;
			r = Math.round(noon.r + (dusk.r - noon.r) * localP);
			g = Math.round(noon.g + (dusk.g - noon.g) * localP);
			b = Math.round(noon.b + (dusk.b - noon.b) * localP);
		} else {
			const localP = (p - 0.5) * 2;
			r = Math.round(dusk.r + (night.r - dusk.r) * localP);
			g = Math.round(dusk.g + (night.g - dusk.g) * localP);
			b = Math.round(dusk.b + (night.b - dusk.b) * localP);
		}

		return `rgb(${r}, ${g}, ${b})`;
	};

	const skyColor = getInterpolatedColor(scrollProgress);

	return (
		<div
			className="fixed inset-y-0 left-0 right-0 md:right-20 -z-10 transition-colors duration-500 ease-linear"
			style={{ backgroundColor: skyColor }}
		>
			<Stars scrollProgress={scrollProgress} />

			{(() => {
				const sunPos = celestialPosition(
					windowedProgress(scrollProgress, SUN_WINDOW),
					celestial.sun,
				);
				const sunOpacity =
					scrollProgress < 0.45
						? 1
						: Math.max(0, 1 - (scrollProgress - 0.45) / 0.2);
				return (
					<div
						className="absolute"
						style={{
							left: `${sunPos.x}%`,
							top: `${sunPos.y}%`,
							transform: "translate(-50%, -50%)",
							opacity: sunOpacity,
							transition: "opacity 500ms ease-out",
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
				const moonOpacity =
					scrollProgress < 0.5 ? 0 : Math.min(1, (scrollProgress - 0.5) / 0.2);
				return (
					<div
						className="absolute"
						style={{
							left: `${moonPos.x}%`,
							top: `${moonPos.y}%`,
							transform: "translate(-50%, -50%)",
							opacity: moonOpacity,
							transition: "opacity 500ms ease-out",
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
				className="absolute bottom-0 w-full h-[40vh] pointer-events-none transition-opacity duration-700"
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

type Boundary = { id: string; ratio: number };

function Minimap({ scrollProgress }: { scrollProgress: number }) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [boundaries, setBoundaries] = useState<Boundary[]>([]);
	const [viewportRatio, setViewportRatio] = useState(0);
	const isDraggingRef = useRef(false);

	useEffect(() => {
		const measure = () => {
			const docHeight = document.documentElement.scrollHeight;
			const winHeight = window.innerHeight;
			setViewportRatio(winHeight / docHeight);

			const ids = MINIMAP_BOUNDARIES.map((b) => b.id);
			setBoundaries(
				ids.map((id) => {
					const el = document.getElementById(id);
					const top = el ? el.getBoundingClientRect().top + window.scrollY : 0;
					return { id, ratio: top / docHeight };
				}),
			);
		};

		measure();
		const raf = requestAnimationFrame(measure);
		window.addEventListener("resize", measure);
		return () => {
			cancelAnimationFrame(raf);
			window.removeEventListener("resize", measure);
		};
	}, []);

	const scrollToY = (clientY: number) => {
		const el = containerRef.current;
		if (!el) return;
		const rect = el.getBoundingClientRect();
		const ratio = Math.min(Math.max((clientY - rect.top) / rect.height, 0), 1);
		const target =
			ratio * (document.documentElement.scrollHeight - window.innerHeight);
		window.scrollTo({ top: target, behavior: "instant" as ScrollBehavior });
	};

	const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
		isDraggingRef.current = true;
		e.currentTarget.setPointerCapture(e.pointerId);
		scrollToY(e.clientY);
	};

	const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
		if (!isDraggingRef.current) return;
		scrollToY(e.clientY);
	};

	const stopDrag = (e: React.PointerEvent<HTMLDivElement>) => {
		isDraggingRef.current = false;
		if (e.currentTarget.hasPointerCapture(e.pointerId)) {
			e.currentTarget.releasePointerCapture(e.pointerId);
		}
	};

	// Linear progress mapping. Honest, no slowdown.
	const viewportTopPct = scrollProgress * (1 - viewportRatio) * 100;
	const viewportHeightPct = Math.max(viewportRatio * 100, 4);

	return (
		<div
			ref={containerRef}
			onPointerDown={handlePointerDown}
			onPointerMove={handlePointerMove}
			onPointerUp={stopDrag}
			onPointerCancel={stopDrag}
			role="navigation"
			aria-label="Page minimap"
			className="hidden md:block fixed right-0 top-0 w-20 h-screen border-l-2 border-slate-900 cursor-pointer select-none z-40 overflow-hidden touch-none"
			style={{
				background:
					"linear-gradient(to bottom, rgb(135, 206, 235) 0%, rgb(244, 164, 96) 50%, rgb(20, 10, 50) 100%)",
			}}
		>
			<div
				className="absolute left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-yellow-200 border border-yellow-400 shadow-[0_0_6px_rgba(253,224,71,0.7)] pointer-events-none"
				style={{
					top: `${8 + scrollProgress * 40}%`,
					opacity: Math.max(0, 1 - scrollProgress * 1.6),
				}}
			/>
			<div
				className="absolute left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-slate-100 border border-slate-300 pointer-events-none"
				style={{
					top: `${50 + (scrollProgress - 0.5) * 80}%`,
					opacity: Math.max(0, (scrollProgress - 0.55) * 2.5),
				}}
			/>
			{boundaries.map((b) => (
				<div
					key={b.id}
					className="absolute left-0 right-0 h-px bg-slate-900/50 pointer-events-none"
					style={{ top: `${b.ratio * 100}%` }}
				/>
			))}
			<div
				className="absolute left-0 right-0 border-2 border-slate-900 bg-white/25 backdrop-blur-[1px] pointer-events-none"
				style={{
					top: `${viewportTopPct}%`,
					height: `${viewportHeightPct}%`,
				}}
			/>
		</div>
	);
}

function deriveUrlPanel(
	matches: ReturnType<typeof useMatches>,
): PanelKey | null {
	for (const m of matches) {
		if (m.routeId === "/_layout/career") return "career";
		if (m.routeId === "/_layout/projects/$slug") {
			const slug = (m.params as { slug?: string }).slug;
			if (slug && PROJECTS.some((p) => p.slug === slug)) {
				return slug as Project["slug"];
			}
			return null;
		}
	}
	return null;
}

function LayoutHost() {
	const [scrollProgress, setScrollProgress] = useState(0);
	const [celestial, setCelestial] = useCelestialState();
	const [skyOpen, setSkyOpen] = useState(false);

	const matches = useMatches();
	const navigate = useNavigate();
	const urlPanel = deriveUrlPanel(matches);
	// sky popover takes precedence over URL panel; closing sky reveals the URL panel underneath
	const openPanel: PanelKey | null = skyOpen ? "sky" : urlPanel;

	const skyRef = useRef<HTMLDialogElement>(null);
	const careerRef = useRef<HTMLDialogElement>(null);
	const goodwatchRef = useRef<HTMLDialogElement>(null);
	const aistackRef = useRef<HTMLDialogElement>(null);
	const alpriverRef = useRef<HTMLDialogElement>(null);
	const manaschmiedeRef = useRef<HTMLDialogElement>(null);
	const lastTriggerRef = useRef<HTMLElement | null>(null);
	// Tracks the URL-driven panel for the close-event handler to distinguish
	// user-initiated closes (ESC/backdrop) from URL-driven panel transitions.
	const urlPanelRef = useRef<PanelKey | null>(null);

	const panelRefs: Record<
		PanelKey,
		React.RefObject<HTMLDialogElement | null>
	> = useMemo(
		() => ({
			sky: skyRef,
			career: careerRef,
			goodwatch: goodwatchRef,
			aistack: aistackRef,
			alpriver: alpriverRef,
			manaschmiede: manaschmiedeRef,
		}),
		[],
	);

	useEffect(() => {
		urlPanelRef.current = urlPanel;
	}, [urlPanel]);

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
		(Object.keys(panelRefs) as PanelKey[]).forEach((key) => {
			const dialog = panelRefs[key].current;
			if (!dialog) return;
			if (openPanel === key && !dialog.open) {
				lastTriggerRef.current = document.activeElement as HTMLElement | null;
				dialog.showModal();
			} else if (openPanel !== key && dialog.open) {
				dialog.close();
			}
		});
		const side = openPanel ? PANEL_SIDES[openPanel] : null;
		document.body.classList.toggle("panel-open", openPanel !== null);
		document.body.classList.toggle("panel-from-right", side === "right");
		document.body.classList.toggle("panel-from-left", side === "left");
	}, [openPanel, panelRefs]);

	useEffect(() => {
		const cleanups: Array<() => void> = [];
		(Object.keys(panelRefs) as PanelKey[]).forEach((key) => {
			const dialog = panelRefs[key].current;
			if (!dialog) return;
			const onClose = () => {
				if (key === "sky") {
					setSkyOpen(false);
				} else if (
					urlPanelRef.current === key &&
					window.location.pathname !== "/"
				) {
					// URL still says THIS panel should be open, so the close came from
					// user action (ESC/backdrop) — navigate home. If urlPanelRef has
					// moved to another panel (or null), the close was URL-driven and we
					// must not clobber the incoming URL.
					navigate({ to: "/", resetScroll: false });
				}
				const trigger = lastTriggerRef.current;
				if (trigger && typeof trigger.focus === "function") {
					trigger.focus();
				}
			};
			const onClick = (e: MouseEvent) => {
				if (e.target === dialog) dialog.close();
			};
			dialog.addEventListener("close", onClose);
			dialog.addEventListener("click", onClick);
			cleanups.push(() => {
				dialog.removeEventListener("close", onClose);
				dialog.removeEventListener("click", onClick);
			});
		});
		return () => {
			for (const fn of cleanups) fn();
			document.body.classList.remove(
				"panel-open",
				"panel-from-left",
				"panel-from-right",
			);
		};
	}, [navigate, panelRefs]);

	const isNight = scrollProgress > 0.6;
	const navColor = isNight ? "white" : "#0f172a";
	const currentYear = new Date().getFullYear();

	return (
		<div className="font-sans text-slate-900 selection:bg-yellow-200">
			<PixelBackground scrollProgress={scrollProgress} celestial={celestial} />
			<Minimap scrollProgress={scrollProgress} />

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

			<nav className="fixed top-0 left-0 right-0 md:right-20 z-50 px-6 py-4 flex justify-between items-center backdrop-blur-sm bg-white/10 border-b border-white/20">
				<div
					className="text-xl font-black tracking-tighter uppercase flex items-center gap-2 drop-shadow-md transition-colors duration-1000"
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
					className="hidden md:flex gap-8 font-bold text-sm uppercase tracking-widest drop-shadow-sm transition-colors duration-1000"
					style={{ color: navColor }}
				>
					<a
						href={`#${SECTION_IDS.linktree}`}
						className="hover:opacity-70 transition-colors"
					>
						Connect
					</a>
					<a
						href={`#${SECTION_IDS.story}`}
						className="hover:opacity-70 transition-colors"
					>
						About
					</a>
					<a
						href={`#${SECTION_IDS.projects}`}
						className="hover:opacity-70 transition-colors"
					>
						Projects
					</a>
					<a
						href={`#${SECTION_IDS.cta}`}
						className="hover:opacity-70 transition-colors"
					>
						Collab
					</a>
				</div>
				<div className="flex items-center gap-4">
					<a
						href={`#${SECTION_IDS.linktree}`}
						className={`p-2 px-4 font-bold text-sm transition-all active:scale-95 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] duration-1000 ${isNight ? "bg-white text-slate-900 hover:bg-slate-200" : "bg-slate-900 text-white hover:bg-slate-800"}`}
					>
						Follow Me
					</a>
				</div>
			</nav>

			<div className="main-shell min-h-screen md:pr-20">
				{/* Hero — top, sky/day */}
				<section
					id={SECTION_IDS.hero}
					className="min-h-[70vh] flex flex-col items-center justify-center px-6 pt-24 pb-12 text-center"
				>
					<img
						src="/alper-avatar.webp"
						alt="Alp portrait"
						className="w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] mb-8 object-cover"
					/>
					<h1 className="text-6xl md:text-8xl font-black mb-6 leading-[0.9] tracking-tighter drop-shadow-sm text-slate-900">
						HEY, I'M ALPER.
					</h1>
					<p className="text-xl md:text-2xl text-slate-800 max-w-xl font-medium leading-relaxed bg-white/40 backdrop-blur-md p-4 border-l-4 border-slate-900 shadow-sm">
						I build open-source tools, ship web apps, and share the journey out
						loud.
					</p>
				</section>

				{/* Linktree — single column, sectioned by VIDEO / POSTS / CODE */}
				<section
					id={SECTION_IDS.linktree}
					className="py-24 px-6 relative overflow-hidden text-slate-900"
				>
					<div className="max-w-[640px] mx-auto relative z-10">
						<div className="text-center mb-12">
							<h2 className="text-4xl md:text-6xl font-black mb-4 uppercase tracking-tighter drop-shadow-[4px_4px_0px_rgba(255,255,255,0.5)]">
								Find Me Online
							</h2>
							<p className="text-base font-bold opacity-90 bg-white/40 backdrop-blur-md px-4 py-2 border-l-4 border-slate-900 inline-block">
								Pick a platform. I'm here, posting, shipping, replying.
							</p>
						</div>

						<div className="space-y-10">
							{SOCIAL_GROUPS.map((group) => (
								<div key={group.title}>
									<div className="flex items-center gap-3 mb-4">
										<group.Icon size={20} />
										<h3 className="text-xs font-black uppercase tracking-[0.3em] opacity-70">
											{group.title}
										</h3>
										<div className="flex-1 h-px bg-slate-900/20" />
									</div>
									<div className="space-y-3">
										{group.links.map((link) => (
											<SocialLink key={link.label} {...link} />
										))}
									</div>
								</div>
							))}
						</div>
					</div>
				</section>

				{/* Story — narrative middle; ends with Career trigger */}
				<section id={SECTION_IDS.story} className="py-24 px-6">
					<div className="max-w-4xl mx-auto">
						<div className="grid md:grid-cols-2 gap-16 items-center">
							<div className="relative">
								<div className="aspect-square bg-slate-200 border-4 border-slate-900 overflow-hidden shadow-[12px_12px_0px_0px_rgba(255,255,255,0.5)]">
									<img
										src="/alper-avatar.webp"
										alt="Alp portrait, alternate"
										className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700 cursor-pixel"
									/>
								</div>
								<div className="absolute -bottom-4 -right-4 w-24 h-24 bg-yellow-300 border-4 border-slate-900 -z-10" />
							</div>
							<div>
								<h2 className="text-4xl font-black mb-6 uppercase tracking-tight text-slate-900 drop-shadow-sm">
									The Story
								</h2>
								<p className="text-lg text-slate-800 font-medium leading-relaxed mb-6 drop-shadow-sm">
									I ship. I share what I ship. Most of what I make is for the
									community of builders, players, and curious folks who hang
									around the same corners of the internet I do.
								</p>
								<p className="text-lg text-slate-800 font-medium leading-relaxed drop-shadow-sm">
									Open-source tools, web apps, videos about the build. The work
									is the conversation, and the conversation pulls the next thing
									out of me. Stick around — there's always something new in
									motion.
								</p>
								<div className="mt-8 flex flex-wrap gap-2">
									{[
										"Open Source",
										"Web Apps",
										"Content Creation",
										"Video Production",
										"Community",
									].map((skill) => (
										<span
											key={skill}
											className="px-3 py-1 bg-white border border-slate-900 text-sm font-bold"
										>
											{skill}
										</span>
									))}
								</div>
							</div>
						</div>

						<button
							type="button"
							onClick={(e) => {
								lastTriggerRef.current = e.currentTarget;
								navigate({ to: "/career", resetScroll: false });
							}}
							className="mt-16 w-full bg-slate-900 text-white p-6 md:p-8 border-4 border-slate-900 shadow-[8px_8px_0px_0px_rgba(255,255,255,0.4)] hover:-translate-y-1 transition-transform flex items-center justify-between gap-6 font-black uppercase tracking-tighter text-xl md:text-3xl"
						>
							<ArrowLeft size={32} className="shrink-0" />
							<span>See the work history</span>
						</button>
					</div>
				</section>

				{/* Projects — 4 alt L/R brutalist trigger cards */}
				<section
					id={SECTION_IDS.projects}
					className="py-24 px-6 bg-white/5 backdrop-blur-md transition-colors duration-1000"
					style={{ color: scrollProgress > 0.5 ? "white" : "#0f172a" }}
				>
					<div className="max-w-5xl mx-auto">
						<div className="flex justify-between items-end mb-16">
							<div>
								<h2 className="text-5xl font-black uppercase tracking-tighter drop-shadow-sm">
									Selected Works
								</h2>
								<div
									className={`w-24 h-2 mt-4 shadow-sm transition-colors duration-1000 ${scrollProgress > 0.5 ? "bg-white" : "bg-slate-900"}`}
								/>
							</div>
							<div className="hidden md:block font-bold uppercase tracking-widest text-sm drop-shadow-sm">
								Current Year: {currentYear}
							</div>
						</div>

						<div className="space-y-8">
							{PROJECTS.map((p) => {
								const Icon = PROJECT_ICONS[p.iconKey];
								const isRight = PANEL_SIDES[p.slug] === "right";
								return (
									<button
										key={p.slug}
										type="button"
										onClick={(e) => {
											lastTriggerRef.current = e.currentTarget;
											navigate({
												to: "/projects/$slug",
												params: { slug: p.slug },
												resetScroll: false,
											});
										}}
										className={`group block w-full max-w-2xl bg-white text-slate-900 text-left p-6 md:p-8 border-4 border-slate-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-2 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all ${isRight ? "ml-auto" : "ml-0"}`}
									>
										<div className="flex items-center justify-between gap-6">
											<div className="flex items-center gap-5 min-w-0">
												{isRight && (
													<div
														className={`w-14 h-14 ${p.panelLight} flex items-center justify-center border-2 border-slate-900 shrink-0`}
													>
														<Icon size={24} />
													</div>
												)}
												{!isRight && (
													<ArrowLeft
														size={28}
														className="shrink-0 group-hover:-translate-x-1 transition-transform"
													/>
												)}
												<div className="min-w-0">
													<h3 className="text-2xl md:text-3xl font-black uppercase leading-none mb-1 truncate">
														{p.title}
													</h3>
													<p className="text-sm text-slate-600 font-medium line-clamp-1">
														{p.desc}
													</p>
												</div>
											</div>
											{isRight && (
												<ArrowRight
													size={28}
													className="shrink-0 group-hover:translate-x-1 transition-transform"
												/>
											)}
											{!isRight && (
												<div
													className={`w-14 h-14 ${p.panelLight} flex items-center justify-center border-2 border-slate-900 shrink-0`}
												>
													<Icon size={24} />
												</div>
											)}
										</div>
									</button>
								);
							})}
						</div>
					</div>
				</section>

				{/* CTA — freelance / collab */}
				<section id={SECTION_IDS.cta} className="py-24 px-6">
					<div className="bg-slate-900 text-white border-4 border-slate-900 shadow-[12px_12px_0px_0px_rgba(255,255,255,0.2)] p-10 max-w-3xl mx-auto">
						<h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-4 leading-[0.95]">
							Let's build something together
						</h2>
						<p className="text-lg opacity-80 mb-8 leading-relaxed">
							Freelance gigs, collabs, side-quests with people who care about
							the craft — drop a line and let's talk.
						</p>
						<a
							href="mailto:alportac@gmail.com"
							className="inline-flex items-center gap-3 bg-white text-slate-900 px-6 py-4 font-black uppercase text-sm tracking-widest shadow-[6px_6px_0px_0px_rgba(255,255,255,0.4)] hover:-translate-y-1 transition-transform"
						>
							<Mail size={18} />
							alportac@gmail.com
						</a>
					</div>
				</section>

				<footer
					id={SECTION_IDS.footer}
					className="py-12 px-6 border-t border-white/20 bg-slate-900/40 backdrop-blur-md transition-colors duration-1000"
					style={{ color: isNight ? "white" : "#0f172a" }}
				>
					<div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
						<div className="font-black uppercase tracking-tighter drop-shadow-sm">
							© {currentYear} ALP — CREATING EVERY DAY
						</div>
						<div className="flex items-center gap-2 text-sm font-bold drop-shadow-sm">
							{scrollProgress < 0.5 ? <Sun size={16} /> : <Moon size={16} />}
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

			<dialog
				ref={skyRef}
				aria-labelledby={SKY_PANEL_TITLE_ID}
				className={`panel-dialog slide-${PANEL_SIDES.sky}`}
				style={
					{
						"--panel-bg": "#ffffff",
						"--panel-fg": "#0f172a",
					} as React.CSSProperties
				}
			>
				<SkyTuningPanel
					state={celestial}
					onChange={setCelestial}
					onClose={() => setSkyOpen(false)}
				/>
			</dialog>

			<dialog
				ref={careerRef}
				aria-labelledby={CAREER_PANEL_TITLE_ID}
				className={`panel-dialog slide-${PANEL_SIDES.career}`}
				style={
					{
						"--panel-bg": "#1e293b",
						"--panel-fg": "#f8fafc",
					} as React.CSSProperties
				}
			>
				<CareerPanel
					onClose={() => navigate({ to: "/", resetScroll: false })}
				/>
			</dialog>

			{PROJECTS.map((p) => (
				<dialog
					key={p.slug}
					ref={panelRefs[p.slug]}
					aria-labelledby={getProjectPanelTitleId(p.slug)}
					className={`panel-dialog slide-${PANEL_SIDES[p.slug]}`}
					style={
						{
							"--panel-bg": p.panelColor,
							"--panel-fg": "#fff",
						} as React.CSSProperties
					}
				>
					<ProjectPanel
						project={p}
						open={openPanel === p.slug}
						onClose={() => navigate({ to: "/", resetScroll: false })}
					/>
				</dialog>
			))}

			{/* Outlet must be rendered so child routes are matched by useMatches; children render null */}
			<div style={{ display: "none" }} aria-hidden="true">
				<Outlet />
			</div>

			<style
				// biome-ignore lint/security/noDangerouslySetInnerHtml: scoped keyframes for pixel ambient animations
				dangerouslySetInnerHTML={{
					__html: `
						html { scroll-behavior: smooth; }
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
