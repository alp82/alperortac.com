import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { memo, useRef } from "react";
import {
	PANEL_FALLBACK_COLOR,
	PROJECT_ICONS,
	PROJECTS,
	type Project,
} from "../../data/projects";
import { SECTION_IDS } from "../../data/sections";
import { SectionTitle, useSectionNightPhase } from "./SectionTitle";

/*
 * The Projects band (wayfinder #47): a flat showcase of every PROJECTS entry
 * between Socials and Craft. Identity locked on ticket #45 ("sunlit clearing",
 * terracotta accent, L1 featured pair + grid); the split-control card locked
 * on ticket #44 (S3 Frosted Glass: whole card dives to the in-site subpage,
 * quiet top-right pill escapes to the external site in a new tab). Tier reads
 * from SIZE alone - no "Highlight" label, no status badge.
 */

// Locked terracotta ink + glow RGB (ticket #45 accent decision).
const PROJECTS_ACCENT = "#b4531f";
const PROJECTS_GLOW = "251,146,60";

// The locked accent works as DECORATION but fails as TEXT. Measured in the
// running app (ticket #51): the band sits at scroll progress ~0.17, so its
// backdrop is daylight sky, and #b4531f on that sky is 2.87:1 - under the 4.5:1
// floor the 12px/900 eyebrow needs. C4 predicted this would bite at night; the
// band never reaches night (NIGHT_UI_THRESHOLD is 0.55), so it bites in the one
// phase the band actually occupies. Same hue (20.9deg) and saturation as the
// locked accent, lightness moved until both clear 4.5:1 against the skies the
// eyebrow is really seen against - the day tone across the band's whole scroll
// range (5.02:1 on noon, 4.58:1 as the sky warms), the night tone against
// SKY_NIGHT (4.64:1) so the eyebrow stays legible if the band ever drifts late.
// The undarkened accent stays on the underline, which is decorative and exempt.
const PROJECTS_ACCENT_TEXT_DAY = "#7a3815";
const PROJECTS_ACCENT_TEXT_NIGHT = "#cc5e23";

const hostOf = (link: string) => {
	try {
		return new URL(link).host.replace(/^www\./, "");
	} catch {
		return link;
	}
};

const mix = (hex: string, pct: number, other: string) =>
	`color-mix(in srgb, ${hex} ${pct}%, ${other})`;

function ProjectSplitCard({
	project,
	night,
	lastTriggerRef,
}: {
	project: Project;
	night: boolean;
	lastTriggerRef: React.RefObject<HTMLElement | null>;
}) {
	const navigate = useNavigate();
	const Icon = PROJECT_ICONS[project.iconKey];
	const big = project.highlight;
	// Hoisted once (ProjectPanel.tsx does the same): without the fallback,
	// color-mix() would receive the literal string "undefined" (invalid CSS,
	// tintless band) for a project with no panelColor.
	const panelColor = project.panelColor ?? PANEL_FALLBACK_COLOR;
	// Two-tone phase-adaptive focus indicator (C2): the band scrolls from day
	// into night sky (SKY_NIGHT is near-black), and `night` is FROZEN at mount
	// from the section's centre progress while the strokes paint against the
	// LIVE sky - so no single color can clear WCAG 1.4.11's 3:1 across the
	// whole dusk window on every backdrop the strokes land on (raw sky,
	// sun-glow, media band, frosted card). Like the UA's own two-tone ring,
	// the indicator is two adjacent contrasting bands: the ring paints at the
	// border box (0-2px out), the outline 2px further out (2-4px out), one
	// light and one dark, so one band is always visible. Verified by sweeping
	// the DEFAULT_SKY_CURVE p in [0,1] over all four backdrop stacks: the
	// better band never drops below 4.1:1 for either phase pair. The swap
	// still tracks the frozen phase (same pattern as .btn-brutalist--night in
	// styles.css; slate-50 is their #f8fafc) so the OUTER band is the one
	// tuned to the section's own sky - night puts the light stroke outside.
	const focusRing = `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:ring-2 ${
		night
			? "focus-visible:outline-slate-50 focus-visible:ring-slate-900"
			: "focus-visible:outline-slate-900 focus-visible:ring-white"
	}`;
	// The escape-hatch <a> is a SIBLING of the button, not a child: interactive
	// content inside a button is invalid HTML and unreliable for AT/keyboard.
	// Chrome (border, bg, shadow, hover translate, ring, group) lives on the
	// wrapper; the button carries its own full-span layout classes so its rect
	// still spans the card - the dive aims at that rect. Everything INSIDE the
	// button is phrasing content (<span className="block/flex ...">, the house
	// pattern from the Craft trigger body): a <button> may not contain flow
	// content, so the title cannot be a heading here. Known trade-off of the
	// locked whole-card-button design: ARIA's presentational-children rule for
	// role=button is honored by Safari/VoiceOver but NOT by NVDA (which does
	// announce headings nested in buttons), so rendering the titles as <span>s
	// removes them from the heading tree uniformly - including for NVDA users
	// who previously could heading-jump to them.
	return (
		<div
			className={`group relative h-full border border-white/50 bg-white/25 text-slate-900 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.35)] backdrop-blur-md transition-transform hover:-translate-y-1 ${
				big ? "ring-2 ring-white/80" : ""
			}`}
		>
			<button
				type="button"
				onClick={(e) => {
					lastTriggerRef.current = e.currentTarget;
					navigate({
						to: "/projects/$slug",
						params: { slug: project.slug },
						resetScroll: false,
					});
				}}
				className={`flex h-full w-full flex-col text-left ${focusRing}`}
			>
				<span
					className={`flex w-full items-center justify-center border-b border-white/40 ${
						big ? "h-44" : "h-28"
					}`}
					style={{
						backgroundColor: mix(panelColor, 18, "transparent"),
						color: mix(panelColor, 70, "#1e293b"),
					}}
				>
					<Icon size={big ? 60 : 42} />
				</span>
				<span className="flex flex-1 flex-col gap-3 p-5">
					<span
						className={`block break-words font-black uppercase leading-none tracking-tighter text-slate-900 ${
							big ? "text-4xl" : "text-2xl"
						}`}
					>
						{project.title}
					</span>
					<span className="block text-sm leading-snug text-slate-800/80">
						{project.desc}
					</span>
					<span className="flex flex-wrap gap-2">
						{project.tags.map((t) => (
							<span
								key={t}
								// Full opacity, not /80: at 10px/900 these need 4.5:1, and the
								// 80% wash measured 4.31:1 on the frosted card (ticket #51).
								className="text-[10px] font-black uppercase tracking-widest text-slate-700"
							>
								#{t}
							</span>
						))}
					</span>
					<span className="mt-auto flex items-center gap-2 pt-1 text-xs font-black uppercase tracking-widest text-slate-800">
						View details
						<ArrowRight
							size={16}
							className="transition-transform group-hover:translate-x-1"
						/>
					</span>
				</span>
			</button>

			{/* external escape hatch - stops the dive, opens a new tab */}
			{/* The pill clears the 24px WCAG floor at 28px, but the dive button sits
			    directly under it on every side with NO buffer, so a near-miss fired
			    the dive instead of the link (measured on touch, ticket #51: 4px out
			    in any direction hit the card). The ::after grows the hit area 8px
			    past the visible pill without moving or resizing it, so the margin of
			    error resolves to the link the finger was aiming at. */}
			<a
				href={project.link}
				target="_blank"
				rel="noopener noreferrer"
				onClick={(e) => e.stopPropagation()}
				aria-label={`Visit ${project.title} (opens in new tab)`}
				className={`absolute right-3 top-3 inline-flex min-h-7 items-center gap-1.5 border border-white/70 bg-white/50 px-2.5 py-1 text-[11px] font-black tracking-wider text-slate-900 backdrop-blur transition-colors after:absolute after:-inset-2 after:content-[''] hover:bg-white/80 ${focusRing}`}
			>
				{hostOf(project.link)}
				<ArrowUpRight size={13} aria-hidden="true" />
			</a>
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
	// eyebrow, title, and tagline must all agree on day vs night.
	const night = useSectionNightPhase(sectionRef);
	const highlights = PROJECTS.filter((p) => p.highlight);
	const regulars = PROJECTS.filter((p) => !p.highlight);
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
					<p
						className={`mt-5 max-w-xl text-lg font-medium leading-relaxed ${
							night ? "text-white/85" : "text-slate-900/80"
						}`}
					>
						Everything I&apos;ve built and I&apos;m currently working on.
					</p>
				</header>

				<div className="flex flex-col gap-8">
					{/* featured pair, sitting in the sunlit clearing - the glow only
					    exists when something is highlighted, so a data edit clearing
					    every `highlight` never leaves an orphan sun blob */}
					{highlights.length > 0 && (
						<div className="relative">
							<div
								aria-hidden="true"
								className="projects-sun-glow pointer-events-none absolute -inset-x-8 -inset-y-6 -z-10 rounded-[40px]"
								style={{
									background: `radial-gradient(60% 80% at 50% 40%, rgba(${PROJECTS_GLOW},0.55), rgba(${PROJECTS_GLOW},0) 70%)`,
								}}
							/>
							<div
								data-testid="projects-featured"
								className="grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2"
							>
								{highlights.map((p) => (
									<ProjectSplitCard
										key={p.slug}
										project={p}
										night={night}
										lastTriggerRef={lastTriggerRef}
									/>
								))}
							</div>
						</div>
					)}
					{/* the rest of the field */}
					<div
						data-testid="projects-regular"
						className="grid grid-cols-2 items-stretch gap-5 lg:grid-cols-3"
					>
						{regulars.map((p) => (
							<ProjectSplitCard
								key={p.slug}
								project={p}
								night={night}
								lastTriggerRef={lastTriggerRef}
							/>
						))}
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
