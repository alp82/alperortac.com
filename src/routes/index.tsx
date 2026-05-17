import { createFileRoute } from "@tanstack/react-router";
import {
	ArrowRight,
	Briefcase,
	Code2,
	Cpu,
	ExternalLink,
	MessageCircle,
	Moon,
	Palette,
	PlaySquare,
	Sun,
	Video,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

export const Route = createFileRoute("/")({ component: Home });

type Project = {
	title: string;
	desc: string;
	link: string;
	tags: string[];
	color: string;
	icon: React.ReactElement;
};

const PROJECTS: Project[] = [
	{
		title: "GoodWatch",
		desc: "Discover, track, and share movies and TV shows effortlessly.",
		link: "https://goodwatch.app",
		tags: ["Web App", "Entertainment"],
		color: "bg-red-100 text-red-800",
		icon: <PlaySquare size={20} />,
	},
	{
		title: "AIStack",
		desc: "A curated directory and stack of the best AI tools and resources.",
		link: "https://aistack.to",
		tags: ["AI", "Directory"],
		color: "bg-blue-100 text-blue-800",
		icon: <Cpu size={20} />,
	},
	{
		title: "Alp-River",
		desc: "An open-source project exploring unique data flows and architecture.",
		link: "https://github.com/alp82/alp-river",
		tags: ["Open Source", "GitHub"],
		color: "bg-emerald-100 text-emerald-800",
		icon: <Code2 size={20} />,
	},
	{
		title: "Manaschmiede",
		desc: "Open-source creative and development tools repository.",
		link: "https://github.com/alp82/manaschmiede",
		tags: ["Open Source", "Tooling"],
		color: "bg-purple-100 text-purple-800",
		icon: <Palette size={20} />,
	},
];

type SocialLinkData = { label: string; href?: string };

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
			{ label: "YouTube", href: "https://www.youtube.com/@AlperTheOrtac" },
			{ label: "TikTok", href: "https://www.tiktok.com/@alperortac" },
			{
				label: "Instagram",
				href: "https://www.instagram.com/alper.the.ortac/",
			},
		],
	},
	{
		title: "Posts",
		Icon: MessageCircle,
		links: [
			{ label: "X (Twitter)", href: "https://x.com/alperortac" },
			{ label: "Threads", href: "https://www.threads.com/@alper.the.ortac" },
			{
				label: "Bluesky",
				href: "https://bsky.app/profile/alperortac.bsky.social",
			},
		],
	},
	{
		title: "Code & Pro",
		Icon: Briefcase,
		links: [
			{ label: "GitHub", href: "https://github.com/alp82" },
			{
				label: "LinkedIn",
				href: "https://www.linkedin.com/in/alper-ortac-b8319549/",
			},
		],
	},
];

const SOCIAL_LINK_CLASS =
	"flex items-center justify-between w-full text-left group p-3 border-2 border-slate-900 transition-all font-bold uppercase tracking-wider";

function SocialLink({ label, href }: SocialLinkData) {
	const arrow = (
		<ArrowRight
			size={16}
			className="opacity-0 group-hover:opacity-100 transition-opacity"
		/>
	);

	if (href) {
		return (
			<a
				href={href}
				target="_blank"
				rel="noopener noreferrer"
				className={`${SOCIAL_LINK_CLASS} hover:bg-slate-900 hover:text-white`}
			>
				<span>{label}</span>
				{arrow}
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
			<span>{label}</span>
			{arrow}
		</button>
	);
}

type CelestialParams = {
	startX: number;
	startY: number;
	endX: number;
	endY: number;
	arcLift: number;
};

type CelestialState = { sun: CelestialParams; moon: CelestialParams };

const DEFAULT_CELESTIAL: CelestialState = {
	sun: { startX: 75, startY: 12, endX: 28, endY: 58, arcLift: 8 },
	moon: { startX: 27, startY: 45, endX: 16, endY: 13, arcLift: 6 },
};

const CELESTIAL_PRESETS: Record<string, CelestialState> = {
	Classic: DEFAULT_CELESTIAL,
	Crossover: {
		sun: { startX: 80, startY: 15, endX: 20, endY: 55, arcLift: 10 },
		moon: { startX: 20, startY: 60, endX: 75, endY: 18, arcLift: 8 },
	},
	Parallel: {
		sun: { startX: 72, startY: 10, endX: 72, endY: 60, arcLift: 14 },
		moon: { startX: 25, startY: 60, endX: 25, endY: 12, arcLift: 14 },
	},
	Centered: {
		sun: { startX: 50, startY: 15, endX: 50, endY: 70, arcLift: 0 },
		moon: { startX: 50, startY: 70, endX: 50, endY: 15, arcLift: 0 },
	},
};
const SUN_WINDOW = { start: 0, end: 0.65 };
const MOON_WINDOW = { start: 0.45, end: 1.0 };
const CELESTIAL_STORAGE_KEY = "alp-celestial-v1";

function windowedProgress(p: number, win: { start: number; end: number }) {
	const range = win.end - win.start;
	if (range <= 0) return 0;
	return Math.min(Math.max((p - win.start) / range, 0), 1);
}

function celestialPosition(localProgress: number, params: CelestialParams) {
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

const CELESTIAL_FIELD_META: Record<
	keyof CelestialParams,
	{ min: number; max: number }
> = {
	startX: { min: 0, max: 100 },
	startY: { min: 0, max: 100 },
	endX: { min: 0, max: 100 },
	endY: { min: 0, max: 100 },
	arcLift: { min: -30, max: 30 },
};

function CelestialControls({
	state,
	onChange,
}: {
	state: CelestialState;
	onChange: (s: CelestialState) => void;
}) {
	const [open, setOpen] = useState(false);
	const [copied, setCopied] = useState(false);

	const updateField = (
		body: "sun" | "moon",
		key: keyof CelestialParams,
		value: number,
	) => {
		onChange({ ...state, [body]: { ...state[body], [key]: value } });
	};

	const copyValues = async () => {
		try {
			await navigator.clipboard.writeText(JSON.stringify(state, null, 2));
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		} catch {
			// clipboard unavailable
		}
	};

	if (!open) {
		return (
			<button
				type="button"
				onClick={() => setOpen(true)}
				className="fixed bottom-4 left-4 z-50 bg-slate-900 text-white px-3 py-2 border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.4)] font-black uppercase text-xs tracking-widest hover:-translate-y-0.5 transition-transform"
			>
				Tune ☀ ☾
			</button>
		);
	}

	return (
		<div className="fixed bottom-4 left-4 z-50 w-80 max-h-[85vh] overflow-y-auto bg-white/95 backdrop-blur-md border-2 border-slate-900 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-4 font-mono text-slate-900">
			<div className="flex justify-between items-center mb-3">
				<h3 className="font-black uppercase text-sm tracking-wider">
					Celestial Paths
				</h3>
				<button
					type="button"
					onClick={() => setOpen(false)}
					className="w-6 h-6 flex items-center justify-center border border-slate-900 hover:bg-slate-900 hover:text-white"
					aria-label="Close controls"
				>
					✕
				</button>
			</div>

			<div className="mb-4">
				<div className="text-[10px] uppercase font-bold opacity-60 mb-1">
					Presets
				</div>
				<div className="flex flex-wrap gap-1">
					{Object.entries(CELESTIAL_PRESETS).map(([name, preset]) => (
						<button
							key={name}
							type="button"
							onClick={() => onChange(preset)}
							className="px-2 py-1 bg-slate-100 hover:bg-slate-900 hover:text-white border border-slate-900 font-bold uppercase text-[10px] tracking-wider transition-colors"
						>
							{name}
						</button>
					))}
				</div>
			</div>

			{(["sun", "moon"] as const).map((body) => (
				<div key={body} className="mb-4">
					<div className="font-black uppercase text-xs mb-2 tracking-wider">
						{body === "sun" ? "☀ Sun" : "☾ Moon"}
					</div>
					{(
						Object.keys(CELESTIAL_FIELD_META) as Array<keyof CelestialParams>
					).map((key) => {
						const value = state[body][key];
						const { min, max } = CELESTIAL_FIELD_META[key];
						const rangeId = `celestial-${body}-${key}-range`;
						const numberId = `celestial-${body}-${key}-number`;
						return (
							<div key={key} className="flex items-center gap-2 mb-1.5">
								<label
									htmlFor={rangeId}
									className="w-16 text-[10px] uppercase opacity-70"
								>
									{key}
								</label>
								<input
									id={rangeId}
									type="range"
									min={min}
									max={max}
									value={value}
									onChange={(e) =>
										updateField(body, key, Number(e.target.value))
									}
									className="flex-1 accent-slate-900"
								/>
								<input
									id={numberId}
									aria-label={`${body} ${key} value`}
									type="number"
									min={min}
									max={max}
									value={value}
									onChange={(e) =>
										updateField(body, key, Number(e.target.value))
									}
									className="w-12 px-1 border border-slate-300 text-right text-xs"
								/>
							</div>
						);
					})}
				</div>
			))}

			<div className="flex gap-2 mt-3">
				<button
					type="button"
					onClick={copyValues}
					className="flex-1 bg-slate-900 text-white px-3 py-2 font-bold uppercase text-[10px] tracking-wider hover:bg-slate-700 transition-colors"
				>
					{copied ? "Copied!" : "Copy JSON"}
				</button>
				<button
					type="button"
					onClick={() => onChange(DEFAULT_CELESTIAL)}
					className="px-3 py-2 border-2 border-slate-900 font-bold uppercase text-[10px] tracking-wider hover:bg-slate-100"
				>
					Reset
				</button>
			</div>
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

			const ids = ["connect", "about", "projects"];
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

function Home() {
	const [scrollProgress, setScrollProgress] = useState(0);
	const [celestial, setCelestial] = useCelestialState();

	useEffect(() => {
		const handleScroll = () => {
			const winHeight = window.innerHeight;
			const docHeight = document.documentElement.scrollHeight;
			const totalScroll = docHeight - winHeight;
			const currentScroll = window.scrollY;
			const progress = Math.min(Math.max(currentScroll / totalScroll, 0), 1);
			setScrollProgress(progress);
		};

		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	const isNight = scrollProgress > 0.6;
	const navColor = isNight ? "white" : "#0f172a";

	return (
		<div className="min-h-screen font-sans text-slate-900 selection:bg-yellow-200 md:pr-20">
			<PixelBackground scrollProgress={scrollProgress} celestial={celestial} />
			<Minimap scrollProgress={scrollProgress} />
			<CelestialControls state={celestial} onChange={setCelestial} />

			<nav className="fixed top-0 left-0 right-0 md:right-20 z-50 px-6 py-4 flex justify-between items-center backdrop-blur-sm bg-white/10 border-b border-white/20">
				<div
					className="text-xl font-black tracking-tighter uppercase flex items-center gap-2 drop-shadow-md transition-colors duration-1000"
					style={{ color: navColor }}
				>
					<div
						className={`w-6 h-6 grid grid-cols-2 gap-0.5 p-0.5 transition-colors duration-1000 ${isNight ? "bg-white" : "bg-slate-900"}`}
					>
						<div className={isNight ? "bg-slate-900" : "bg-white"} />
						<div
							className={`opacity-50 ${isNight ? "bg-slate-900" : "bg-white"}`}
						/>
						<div
							className={`opacity-50 ${isNight ? "bg-slate-900" : "bg-white"}`}
						/>
						<div className={isNight ? "bg-slate-900" : "bg-white"} />
					</div>
					Alp
				</div>
				<div
					className="hidden md:flex gap-8 font-bold text-sm uppercase tracking-widest drop-shadow-sm transition-colors duration-1000"
					style={{ color: navColor }}
				>
					<a href="#connect" className="hover:opacity-70 transition-colors">
						Connect
					</a>
					<a href="#about" className="hover:opacity-70 transition-colors">
						About
					</a>
					<a href="#projects" className="hover:opacity-70 transition-colors">
						Projects
					</a>
				</div>
				<div className="flex items-center gap-4">
					<a
						href="#connect"
						className={`p-2 px-4 font-bold text-sm rounded-md transition-all active:scale-95 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] duration-1000 ${isNight ? "bg-white text-slate-900 hover:bg-slate-200" : "bg-slate-900 text-white hover:bg-slate-800"}`}
					>
						Follow Me
					</a>
				</div>
			</nav>

			{/* Hero — top, sky/day */}
			<section className="min-h-screen flex flex-col items-center justify-center px-6 pt-20">
				<div className="max-w-4xl w-full">
					<div className="inline-block px-4 py-1 mb-6 bg-white/80 text-slate-900 font-black text-xs uppercase tracking-widest border-2 border-slate-900 rounded-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
						Hey, I'm Alp
					</div>
					<h1 className="text-6xl md:text-8xl font-black mb-8 leading-[0.9] tracking-tighter drop-shadow-sm text-slate-900">
						CREATING, <br />
						<span className="text-white drop-shadow-[4px_4px_0px_rgba(0,0,0,1)]">
							CODING,
						</span>{" "}
						<br />& SHARING.
					</h1>
					<p className="text-xl md:text-2xl text-slate-800 max-w-xl font-medium leading-relaxed bg-white/40 backdrop-blur-md p-4 border-l-4 border-slate-900 shadow-sm">
						I build open-source tools, launch web apps, and share my journey
						across the internet. Welcome to my digital home.
					</p>
					<div className="mt-10 flex gap-4">
						<a
							href="#connect"
							className="group flex items-center gap-2 bg-slate-900 text-white px-8 py-4 font-bold rounded-sm hover:translate-x-1 transition-all shadow-[6px_6px_0px_0px_rgba(255,255,255,0.4)]"
						>
							Find Me Online{" "}
							<ArrowRight className="group-hover:translate-x-1 transition-transform" />
						</a>
						<a
							href="#projects"
							className="group flex items-center gap-2 bg-white/80 backdrop-blur-sm text-slate-900 px-8 py-4 font-bold rounded-sm border-2 border-slate-900 hover:translate-x-1 transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,0.4)]"
						>
							Dig Into My Work
						</a>
					</div>
				</div>
			</section>

			{/* Connect — top/sky, the linktree surface */}
			<section
				id="connect"
				className="py-32 px-6 relative overflow-hidden text-slate-900"
			>
				<div className="max-w-6xl mx-auto relative z-10">
					<div className="text-center mb-16">
						<h2 className="text-5xl md:text-7xl font-black mb-6 uppercase tracking-tighter drop-shadow-[4px_4px_0px_rgba(255,255,255,0.5)]">
							FIND ME ONLINE
						</h2>
						<p className="text-xl font-bold max-w-2xl mx-auto drop-shadow-sm opacity-90 bg-white/40 backdrop-blur-md p-4 border-l-4 border-slate-900 inline-block">
							I document my journey, share code, and connect with other
							builders. Pick a platform below.
						</p>
					</div>

					<div className="grid md:grid-cols-3 gap-8">
						{SOCIAL_GROUPS.map((group) => (
							<div
								key={group.title}
								className="bg-white/70 backdrop-blur-md p-8 border-4 border-slate-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-2 transition-all text-slate-900"
							>
								<div className="flex items-center gap-3 mb-6">
									<group.Icon size={32} />
									<h3 className="text-2xl font-black uppercase">
										{group.title}
									</h3>
								</div>
								<div className="space-y-4">
									{group.links.map((link) => (
										<SocialLink key={link.label} {...link} />
									))}
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* About — mid, dusk transition */}
			<section id="about" className="py-32 px-6">
				<div className="max-w-4xl mx-auto">
					<div className="grid md:grid-cols-2 gap-16 items-center">
						<div className="relative">
							<div className="aspect-square bg-slate-200 border-4 border-slate-900 overflow-hidden shadow-[12px_12px_0px_0px_rgba(255,255,255,0.5)]">
								<div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=800')] bg-cover grayscale hover:grayscale-0 transition-all duration-700 cursor-pixel" />
							</div>
							<div className="absolute -bottom-4 -right-4 w-24 h-24 bg-yellow-300 border-4 border-slate-900 -z-10" />
						</div>
						<div>
							<h2 className="text-4xl font-black mb-6 uppercase tracking-tight text-slate-900 drop-shadow-sm">
								The Story
							</h2>
							<p className="text-lg text-slate-800 font-medium leading-relaxed mb-6 drop-shadow-sm">
								I grew up fascinated by the intersection of limitations and
								creativity—the way pixel art uses a tiny grid to convey vast
								worlds.
							</p>
							<p className="text-lg text-slate-800 font-medium leading-relaxed drop-shadow-sm">
								Today, I bring that same philosophy to my code and my content.
								Whether I'm building open-source tools, creating full-stack web
								applications, or documenting the process via video, I strip away
								the noise to focus on what matters.
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
										className="px-3 py-1 bg-white border border-slate-300 text-sm font-bold rounded-sm shadow-sm"
									>
										{skill}
									</span>
								))}
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Projects — bottom, ground/night. Career + side projects. */}
			<section
				id="projects"
				className="py-32 px-6 bg-white/5 backdrop-blur-md transition-colors duration-1000"
				style={{ color: scrollProgress > 0.5 ? "white" : "#0f172a" }}
			>
				<div className="max-w-6xl mx-auto">
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
							Current Year: 2026
						</div>
					</div>

					<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
						{PROJECTS.map((p) => (
							<div
								key={p.title}
								className="group bg-white text-slate-900 p-8 border-4 border-slate-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-2 hover:-translate-x-2 hover:shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] transition-all flex flex-col"
							>
								<div
									className={`w-12 h-12 ${p.color} flex items-center justify-center mb-6 border-2 border-slate-900`}
								>
									{p.icon}
								</div>
								<h3 className="text-2xl font-black mb-4 uppercase leading-none">
									{p.title}
								</h3>
								<p className="text-slate-600 mb-6 font-medium line-clamp-3 flex-grow">
									{p.desc}
								</p>
								<div className="flex flex-wrap gap-2 mb-8">
									{p.tags.map((tag) => (
										<span
											key={tag}
											className="text-[10px] uppercase font-black tracking-widest border-b-2 border-slate-200"
										>
											#{tag}
										</span>
									))}
								</div>
								<a
									href={p.link}
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center gap-2 font-black text-sm uppercase group-hover:text-blue-600 transition-colors mt-auto"
								>
									View Project <ExternalLink size={14} />
								</a>
							</div>
						))}
					</div>
				</div>
			</section>

			<footer
				className="py-12 px-6 border-t border-white/20 bg-slate-900/40 backdrop-blur-md transition-colors duration-1000"
				style={{ color: isNight ? "white" : "#0f172a" }}
			>
				<div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
					<div className="font-black uppercase tracking-tighter drop-shadow-sm">
						© 2026 ALP — CREATING EVERY DAY
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
