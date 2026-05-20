import {
	SiBluesky,
	SiGithub,
	SiInstagram,
	SiThreads,
	SiTiktok,
	SiX,
	SiYoutube,
} from "@icons-pack/react-simple-icons";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import {
	ArrowRight,
	Briefcase,
	Mail,
	MessageCircle,
	Moon,
	Sun,
	Video,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Minimap } from "../components/Minimap";
import { PixelBackground } from "../components/PixelBackground";
import { PanelHost } from "../components/_layout/PanelHost";
import { SectionTriggerCard } from "../components/_layout/SectionTriggerCard";
import { type CelestialState, DEFAULT_CELESTIAL } from "../data/celestial";
import { SECTION_IDS } from "../data/sections";
import { DEFAULT_SKY_CURVE, type SkyCurve } from "../data/skyCurve";
import { TOPICS } from "../data/topics";

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

type SocialLinkData = {
	label: string;
	href?: string;
	Icon: BrandIcon;
	brand: string;
};

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
				brand: "#FF0000",
			},
			{
				label: "TikTok",
				href: "https://www.tiktok.com/@alperortac",
				Icon: SiTiktok,
				brand: "#000000",
			},
			{
				label: "Instagram",
				href: "https://www.instagram.com/alper.the.ortac/",
				Icon: SiInstagram,
				brand: "#E4405F",
			},
		],
	},
	{
		title: "Posts",
		Icon: MessageCircle,
		links: [
			{
				label: "X (Twitter)",
				href: "https://x.com/alperortac",
				Icon: SiX,
				brand: "#000000",
			},
			{
				label: "Threads",
				href: "https://www.threads.com/@alper.the.ortac",
				Icon: SiThreads,
				brand: "#000000",
			},
			{
				label: "Bluesky",
				href: "https://bsky.app/profile/alperortac.bsky.social",
				Icon: SiBluesky,
				brand: "#0285FF",
			},
		],
	},
	{
		title: "Code",
		Icon: Briefcase,
		links: [
			{
				label: "GitHub",
				href: "https://github.com/alp82",
				Icon: SiGithub,
				brand: "#181717",
			},
			{
				label: "LinkedIn",
				href: "https://www.linkedin.com/in/alper-ortac-b8319549/",
				Icon: SiLinkedin,
				brand: "#0A66C2",
			},
		],
	},
];

const SOCIAL_LINK_CLASS =
	"flex items-center justify-between w-full text-left group p-3 border-2 border-slate-900 transition-all font-bold uppercase tracking-wider";

function SocialLink({ label, href, Icon, brand }: SocialLinkData) {
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
				style={{ "--brand": brand } as React.CSSProperties}
				className={`${SOCIAL_LINK_CLASS} bg-white/80 hover:bg-[var(--brand)] hover:text-white`}
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
	const [celestial, setCelestial] = useCelestialState();
	const [skyOpen, setSkyOpen] = useState(false);
	const lastTriggerRef = useRef<HTMLElement | null>(null);

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

	const isNight = scrollProgress >= celestial.curve.phase2[0];
	const navColor = isNight ? "white" : "#0f172a";
	const currentYear = new Date().getFullYear();

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
					className="hidden md:flex gap-8 font-bold text-sm uppercase tracking-widest drop-shadow-sm transition-colors duration-100"
					style={{ color: navColor }}
				>
					<a
						href={`#${SECTION_IDS.linktree}`}
						className="hover:opacity-70 transition-colors"
					>
						Connect
					</a>
					<a
						href={`#${SECTION_IDS.craft}`}
						className="hover:opacity-70 transition-colors"
					>
						Path
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
						className={`p-2 px-4 font-bold text-sm transition-all active:scale-95 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] duration-100 ${isNight ? "bg-white text-slate-900 hover:bg-slate-200" : "bg-slate-900 text-white hover:bg-slate-800"}`}
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
						Hi. Software engineer, mostly freelance, with a side project habit
						and a camera.
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

				{/* Craft band — 8 topical articles */}
				<section id={SECTION_IDS.craft} className="py-24 px-6">
					<div className="max-w-5xl mx-auto space-y-24">
						{TOPICS.map((topic) => (
							<article key={topic.id} className="space-y-6">
								<header className="max-w-3xl">
									<h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter">
										{topic.heading}
									</h2>
									<p className="mt-3 text-lg md:text-xl font-medium leading-relaxed bg-white/40 backdrop-blur-md p-3 border-l-4 border-slate-900">
										{topic.teaser}
									</p>
								</header>
								<div className="space-y-6">
									{topic.triggers.map((trigger) => (
										<SectionTriggerCard
											key={trigger.kind === "career" ? "career" : trigger.slug}
											trigger={trigger}
											subtitle={topic.teaser}
											lastTriggerRef={lastTriggerRef}
										/>
									))}
								</div>
							</article>
						))}
					</div>
				</section>

				{/* CTA — freelance / collab */}
				<section id={SECTION_IDS.cta} className="py-24 px-6">
					<div className="bg-slate-900 text-white border-4 border-slate-900 shadow-[12px_12px_0px_0px_rgba(255,255,255,0.2)] p-10 max-w-3xl mx-auto">
						<h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-4 leading-[0.95]">
							You made it to the night.
						</h2>
						<p className="text-lg opacity-80 mb-8 leading-relaxed">
							If any of this resonated — a project, a passion, a way of thinking
							— drop a line.
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
