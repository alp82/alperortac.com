import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { memo, useEffect, useRef, useState } from "react";
import {
	PANEL_FALLBACK_COLOR,
	PROJECT_ICONS,
	PROJECTS,
	type Project,
	type ProjectCardShot,
} from "../../data/projects";
import { SECTION_IDS } from "../../data/sections";
import { CuriaThread } from "./projects/CuriaThread";
import { SectionTitle, useSectionNightPhase } from "./SectionTitle";

/*
 * The Projects band, revamp of 2026-08-09 (design locked in a grilling
 * session, composition picked from prototype variant B "full-bleed posters" -
 * primary source on branch prototype/projects-band-revamp).
 *
 * Three labeled groups replace the old highlight split:
 * - Live Apps: client proof. Two full-width poster rows; the screenshot rests
 *   blurred and DESATURATED and wakes to color + sharp on hover, or on
 *   scroll-into-view where there is no hover. One concrete proof line each.
 * - AI Tools: dev proof. A 2x2 grid where each card's visual is the product
 *   showing itself - static shots for statusline/forge/alfredo, the live
 *   CuriaThread artwork for Curia. The visuals share the apps rows' dormant
 *   blur/desaturate treatment.
 * - Personal: close to home. One slim row of two icon-led mini glass cards.
 *
 * No tagline (the group labels absorb its job), no status badges (every
 * project is actively maintained). Identity stays "sunlit clearing" (#45):
 * terracotta accent, frosted glass, the breathing sun glow now cupping the
 * Live Apps rows. The split-control card contract (#44) and the a11y naming
 * rules (#52) carry over: the whole card is a button that dives to the
 * subpage (aria-label = title, aria-describedby = the desc node), and a
 * quiet sibling pill escapes to the external site in a new tab.
 */

// Locked terracotta ink + glow RGB (ticket #45 accent decision).
const PROJECTS_ACCENT = "#b4531f";
const PROJECTS_GLOW = "251,146,60";

// The locked accent works as DECORATION but fails as TEXT (ticket #51: 2.87:1
// on the band's daylight sky). Same hue and saturation, lightness moved until
// both tones clear 4.5:1 against the skies they are seen against. The
// undarkened accent stays on the underline and the label hairlines, which are
// decorative and exempt.
const PROJECTS_ACCENT_TEXT_DAY = "#7a3815";
const PROJECTS_ACCENT_TEXT_NIGHT = "#cc5e23";

// The shared aspect of the tools image windows: the statusline shot's own
// 870x270, so that image renders whole and the others cut to match.
const TOOL_SHOT_ASPECT = "aspect-[87/27]";

const hostOf = (link: string) => {
	try {
		return new URL(link).host.replace(/^www\./, "");
	} catch {
		return link;
	}
};

const mix = (hex: string, pct: number, other: string) =>
	`color-mix(in srgb, ${hex} ${pct}%, ${other})`;

// Two-tone phase-adaptive focus indicator (C2, unchanged from the pre-revamp
// band): ring at the border box, outline 2px further out, one light one dark,
// swapped by the section's frozen phase so one band always clears 3:1 against
// the live sky.
const focusRingFor = (night: boolean) =>
	`focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:ring-2 ${
		night
			? "focus-visible:outline-slate-50 focus-visible:ring-slate-900"
			: "focus-visible:outline-slate-900 focus-visible:ring-white"
	}`;

const descIdFor = (slug: string) => `projects-card-desc-${slug}`;

/**
 * The dormant visual contract, shared by the apps posters and the tools grid:
 * blurred and desaturated (not fully monochrome - 55% keeps a hint of the
 * product's color alive) at rest, waking to color and sharpness on hover.
 * Devices without hover wake it when the card is more than 60% in view
 * instead - a tap must stay a dive, never a reveal gesture.
 * Both filter functions stay present in every state (blur(0) grayscale(0),
 * never `none`): CSS only interpolates filters over matching function lists.
 */
const dormantFilterClasses = (awake: boolean) =>
	`${
		awake ? "blur-[0px] grayscale-0" : "blur-[4px] grayscale-[55%]"
	} transition-[filter] duration-700 group-hover:blur-[0px] group-hover:grayscale-0 motion-reduce:transition-none`;

function useDormantAwake<T extends HTMLElement>() {
	const ref = useRef<T>(null);
	const [awake, setAwake] = useState(false);
	useEffect(() => {
		// jsdom/SSR guards: no matchMedia or IntersectionObserver there.
		if (
			typeof window.matchMedia !== "function" ||
			!("IntersectionObserver" in window)
		)
			return;
		if (window.matchMedia("(hover: hover)").matches) return;
		const el = ref.current;
		if (!el) return;
		const io = new IntersectionObserver(
			(entries) => setAwake((entries[0]?.intersectionRatio ?? 0) > 0.6),
			{ threshold: [0, 0.6] },
		);
		io.observe(el);
		return () => io.disconnect();
	}, []);
	return { ref, awake };
}

function DormantShot({
	shot,
	className = "",
}: {
	shot: ProjectCardShot;
	className?: string;
}) {
	const { ref, awake } = useDormantAwake<HTMLImageElement>();
	return (
		<img
			ref={ref}
			src={shot.src}
			alt=""
			style={shot.pos ? { objectPosition: shot.pos } : undefined}
			className={`${dormantFilterClasses(awake)} ${className}`}
		/>
	);
}

function GroupLabel({ night, children }: { night: boolean; children: string }) {
	return (
		<p
			className="flex items-center gap-4 text-[11px] font-black uppercase tracking-[0.3em]"
			style={{
				color: night ? PROJECTS_ACCENT_TEXT_NIGHT : PROJECTS_ACCENT_TEXT_DAY,
			}}
		>
			<span
				aria-hidden="true"
				className="h-px flex-1"
				style={{ backgroundColor: `${PROJECTS_ACCENT}66` }}
			/>
			{children}
			<span
				aria-hidden="true"
				className="h-px flex-1"
				style={{ backgroundColor: `${PROJECTS_ACCENT}66` }}
			/>
		</p>
	);
}

/* The quiet escape hatch - a SIBLING of the dive button (interactive content
 * inside a button is invalid HTML). The ::after grows the hit area 8px past
 * the visible pill (ticket #51: with no buffer, a 4px near-miss on touch
 * fired the dive instead of the link). */
function EscapePill({
	project,
	night,
	className = "right-3 top-3",
}: {
	project: Project;
	night: boolean;
	className?: string;
}) {
	return (
		<a
			href={project.link}
			target="_blank"
			rel="noopener noreferrer"
			onClick={(e) => e.stopPropagation()}
			aria-label={`Visit ${project.title} (opens in new tab)`}
			className={`absolute z-10 inline-flex min-h-7 items-center gap-1.5 border border-white/70 bg-white/50 px-2.5 py-1 text-[11px] font-black tracking-wider text-slate-900 backdrop-blur transition-colors after:absolute after:-inset-2 after:content-[''] hover:bg-white/80 ${focusRingFor(night)} ${className}`}
		>
			{hostOf(project.link)}
			<ArrowUpRight size={13} aria-hidden="true" />
		</a>
	);
}

/* Live Apps: a full-width poster row. The screenshot fills the card; the copy
 * floats on a glass panel that alternates corners row by row. Everything
 * inside the button is phrasing content (spans + img), the house pattern. */
function AppRow({
	project,
	flip,
	night,
	lastTriggerRef,
}: {
	project: Project;
	flip: boolean;
	night: boolean;
	lastTriggerRef: React.RefObject<HTMLElement | null>;
}) {
	const navigate = useNavigate();
	const descId = descIdFor(project.slug);
	return (
		<div className="group relative h-72 overflow-hidden border border-white/50 bg-white/25 text-slate-900 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.35)] ring-2 ring-white/80 backdrop-blur-md">
			<button
				type="button"
				aria-label={project.title}
				aria-describedby={descId}
				onClick={(e) => {
					lastTriggerRef.current = e.currentTarget;
					navigate({
						to: "/projects/$slug",
						params: { slug: project.slug },
						resetScroll: false,
					});
				}}
				className={`relative flex h-full w-full cursor-pointer flex-col text-left ${focusRingFor(night)}`}
			>
				{project.cardShot && (
					<DormantShot
						shot={project.cardShot}
						className="absolute inset-0 h-full w-full scale-105 object-cover"
					/>
				)}
				<span
					className={`absolute bottom-5 flex max-w-md flex-col gap-2.5 border border-white/50 bg-white/40 p-6 backdrop-blur-md ${
						flip ? "right-5" : "left-5"
					}`}
				>
					<span className="block break-words text-3xl font-black uppercase leading-none tracking-tighter text-slate-900">
						{project.title}
					</span>
					<span
						id={descId}
						className="block text-sm leading-snug text-slate-800/90"
					>
						{project.desc}
					</span>
					{project.proof && (
						<span
							className="block text-xs font-black uppercase tracking-widest"
							style={{ color: PROJECTS_ACCENT_TEXT_DAY }}
						>
							{project.proof}
						</span>
					)}
					<span className="flex flex-wrap gap-2">
						{project.tags.map((t) => (
							<span
								key={t}
								// Full opacity, not /80: at 10px/900 these need 4.5:1, and
								// the 80% wash measured 4.31:1 on the frosted card (#51).
								className="text-[10px] font-black uppercase tracking-widest text-slate-700"
							>
								#{t}
							</span>
						))}
					</span>
				</span>
			</button>
			<EscapePill project={project} night={night} />
		</div>
	);
}

/* AI Tools: the product in miniature. Image-backed cards put the shot and the
 * footer inside the button (both phrasing content). Curia's self-portrait is
 * the live CuriaThread COMPONENT - flow content, invalid inside a button - so
 * it renders as an inert sibling layer and the button carries the footer. */
function ToolCard({
	project,
	night,
	lastTriggerRef,
}: {
	project: Project;
	night: boolean;
	lastTriggerRef: React.RefObject<HTMLElement | null>;
}) {
	const navigate = useNavigate();
	const descId = descIdFor(project.slug);
	const shot = project.cardShot;
	// Curia's live-artwork layer has no <img> of its own, so the card carries
	// the dormant wake state itself and filters the whole layer.
	const { ref: artRef, awake: artAwake } = useDormantAwake<HTMLSpanElement>();
	const dive = (e: React.MouseEvent<HTMLButtonElement>) => {
		lastTriggerRef.current = e.currentTarget;
		navigate({
			to: "/projects/$slug",
			params: { slug: project.slug },
			resetScroll: false,
		});
	};
	const footer = (
		<span className="mt-auto flex w-full items-center justify-between gap-3 border-t border-white/50 bg-white/50 px-5 py-3 backdrop-blur-md">
			<span className="flex min-w-0 flex-col">
				<span className="truncate text-xl font-black uppercase tracking-tighter text-slate-900">
					{project.title}
				</span>
				<span id={descId} className="truncate text-xs text-slate-800/80">
					{project.desc}
				</span>
			</span>
			<ArrowRight
				size={16}
				aria-hidden="true"
				className="shrink-0 text-slate-800 transition-transform group-hover:translate-x-1"
			/>
		</span>
	);
	return (
		<div className="group relative overflow-hidden border border-white/50 bg-slate-900/20 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.35)] backdrop-blur-md transition-transform hover:-translate-y-1">
			{!shot && (
				// The live-artwork layer (Curia): inert, decorative, behind the
				// button. Scaled into the card window like a thumbnail.
				<span
					ref={artRef}
					aria-hidden="true"
					className={`pointer-events-none absolute inset-0 block select-none overflow-hidden ${dormantFilterClasses(artAwake)}`}
				>
					<span
						className="block origin-top-left scale-[0.6]"
						style={{ width: `${100 / 0.6}%` }}
					>
						<CuriaThread />
					</span>
				</span>
			)}
			<button
				type="button"
				aria-label={project.title}
				aria-describedby={descId}
				onClick={dive}
				className={`relative flex h-full w-full cursor-pointer flex-col text-left ${focusRingFor(night)}`}
			>
				{shot && (
					<DormantShot
						shot={shot}
						className={
							shot.full ? "w-full" : `${TOOL_SHOT_ASPECT} w-full object-cover`
						}
					/>
				)}
				{footer}
			</button>
			<EscapePill project={project} night={night} />
		</div>
	);
}

/* Personal: a mini glass card - icon tile, title, one line of desc. The right
 * padding reserves the pill's corner. */
function PersonalCard({
	project,
	night,
	lastTriggerRef,
}: {
	project: Project;
	night: boolean;
	lastTriggerRef: React.RefObject<HTMLElement | null>;
}) {
	const navigate = useNavigate();
	const descId = descIdFor(project.slug);
	const Icon = PROJECT_ICONS[project.iconKey];
	const panelColor = project.panelColor ?? PANEL_FALLBACK_COLOR;
	return (
		<div className="group relative border border-white/50 bg-white/25 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.35)] backdrop-blur-md transition-transform hover:-translate-y-1">
			<button
				type="button"
				aria-label={project.title}
				aria-describedby={descId}
				onClick={(e) => {
					lastTriggerRef.current = e.currentTarget;
					navigate({
						to: "/projects/$slug",
						params: { slug: project.slug },
						resetScroll: false,
					});
				}}
				className={`flex h-full w-full cursor-pointer items-center gap-4 p-4 pr-16 text-left ${focusRingFor(night)}`}
			>
				<span
					className="flex h-12 w-12 shrink-0 items-center justify-center"
					style={{
						backgroundColor: mix(panelColor, 18, "transparent"),
						color: mix(panelColor, 70, "#1e293b"),
					}}
				>
					<Icon size={26} />
				</span>
				<span className="flex min-w-0 flex-col">
					<span className="truncate text-lg font-black uppercase tracking-tighter text-slate-900">
						{project.title}
					</span>
					<span id={descId} className="truncate text-xs text-slate-800/70">
						{project.desc}
					</span>
				</span>
			</button>
			<EscapePill project={project} night={night} />
		</div>
	);
}

function ProjectsSectionInner({
	lastTriggerRef,
}: {
	lastTriggerRef: React.RefObject<HTMLElement | null>;
}) {
	const sectionRef = useRef<HTMLElement>(null);
	// ONE frozen phase for the whole section (FindMeSection pattern): the
	// eyebrow, title, and group labels must all agree on day vs night.
	const night = useSectionNightPhase(sectionRef);
	const apps = PROJECTS.filter((p) => p.group === "apps");
	const tools = PROJECTS.filter((p) => p.group === "tools");
	const personal = PROJECTS.filter((p) => p.group === "personal");
	return (
		<section ref={sectionRef} id={SECTION_IDS.projects} className="px-6">
			<div className="mx-auto max-w-5xl">
				<header className="mb-12">
					<p
						className="mb-2 text-xs font-black uppercase tracking-[0.3em]"
						style={{
							color: night
								? PROJECTS_ACCENT_TEXT_NIGHT
								: PROJECTS_ACCENT_TEXT_DAY,
						}}
					>
						Selected work
					</p>
					<SectionTitle
						accent={PROJECTS_ACCENT}
						underlineAlign="left"
						night={night}
					>
						Projects
					</SectionTitle>
				</header>

				<div className="flex flex-col gap-14">
					{/* LIVE APPS - poster rows in the sunlit clearing. The glow only
					    exists when the group has members, so a data edit emptying it
					    never leaves an orphan sun blob. */}
					{apps.length > 0 && (
						<div className="relative flex flex-col gap-10">
							<div
								aria-hidden="true"
								className="projects-sun-glow pointer-events-none absolute -inset-x-8 -inset-y-6 -z-10 rounded-[40px]"
								style={{
									background: `radial-gradient(60% 80% at 50% 40%, rgba(${PROJECTS_GLOW},0.55), rgba(${PROJECTS_GLOW},0) 70%)`,
								}}
							/>
							<GroupLabel night={night}>Live Apps</GroupLabel>
							<div data-testid="projects-apps" className="flex flex-col gap-10">
								{apps.map((p, i) => (
									<AppRow
										key={p.slug}
										project={p}
										flip={i % 2 === 1}
										night={night}
										lastTriggerRef={lastTriggerRef}
									/>
								))}
							</div>
						</div>
					)}

					{/* AI TOOLS - the 2x2 self-portrait grid */}
					<div className="flex flex-col gap-6">
						<GroupLabel night={night}>AI Tools</GroupLabel>
						<div
							data-testid="projects-tools"
							className="grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2"
						>
							{tools.map((p) => (
								<ToolCard
									key={p.slug}
									project={p}
									night={night}
									lastTriggerRef={lastTriggerRef}
								/>
							))}
						</div>
					</div>

					{/* PERSONAL - the slim mini-card row */}
					<div className="flex flex-col gap-5">
						<GroupLabel night={night}>Personal</GroupLabel>
						<div
							data-testid="projects-personal"
							className="grid grid-cols-1 gap-5 sm:grid-cols-2"
						>
							{personal.map((p) => (
								<PersonalCard
									key={p.slug}
									project={p}
									night={night}
									lastTriggerRef={lastTriggerRef}
								/>
							))}
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

// Memoised: LayoutHost holds state that changes for reasons unrelated to this
// section (the About dropdown, the settled scroll position, a dive). Without
// this, every one of those re-rendered the whole page - the About-menu open was
// a ~150ms main-thread task on its own.
export const ProjectsSection = memo(ProjectsSectionInner);
