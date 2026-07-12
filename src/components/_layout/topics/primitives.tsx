import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { PERSONAL_BY_SLUG } from "../../../data/personal";
import { PROJECT_ICONS, PROJECTS } from "../../../data/projects";
import { PANEL_SIDES } from "../../../data/sections";
import { STORY_BY_SLUG } from "../../../data/stories";
import type { Trigger } from "../../../data/topics";
import { BorderGlow } from "../BorderGlow";

/*
 * Reusable building blocks for per-topic content components.
 *
 * Each topic in src/components/_layout/topics/ composes these primitives into
 * a body unique to that topic — diverging visual treatments are expected as
 * the personal-brand voice deepens. The outer shell (heading, accent, layout)
 * still lives in current.tsx so all topics share consistent chrome.
 */

export type TopicContentProps = {
	lastTriggerRef: React.RefObject<HTMLElement | null>;
	isNight: boolean;
	accent: string;
};

/**
 * The "voice surface" that wraps a topic's body.
 *
 * `surface` (default `plate`) keeps the frosted plate — translucent bg + left
 * accent border, inverting at night — the production look, used by the baseline
 * CurrentBlock dispatch. The DEV composer passes `light` / `dark` to render the
 * body BARE (transparent, no border, text tuned to the frame) so prose blends
 * into a themed inner frame instead of floating in a card.
 */
export function TopicPlate({
	isNight,
	surface = "plate",
	children,
	className = "",
}: {
	isNight: boolean;
	surface?: "plate" | "light" | "dark";
	children: ReactNode;
	className?: string;
}) {
	if (surface !== "plate") {
		// Bare: blend into the frame's own surface. Text follows the frame, not
		// the phase — dark text on a light frame, light text on a dark one.
		const text = surface === "dark" ? "text-slate-50" : "text-slate-900";
		return <div className={`max-w-3xl ${text} ${className}`}>{children}</div>;
	}
	const themed = isNight
		? "is-night bg-slate-900/55 text-slate-50 border-white/40"
		: "bg-white/40 text-slate-900 border-slate-900";
	return (
		<div
			className={`plate max-w-3xl backdrop-blur-md border-l-4 transition-colors duration-300 ${themed} ${className}`}
		>
			{children}
		</div>
	);
}

export function Paragraph({ children }: { children: ReactNode }) {
	return (
		<p className="text-lg md:text-xl font-medium leading-relaxed">{children}</p>
	);
}

export function InlineLink({
	href,
	children,
	isNight = false,
}: {
	href: string;
	children: ReactNode;
	isNight?: boolean;
}) {
	// Anchors (#foo) scroll within the page; everything else opens in a new
	// tab. The split also drives styling: internal links read as italic +
	// wavy underline (no icon, phase-agnostic), while external links keep a
	// straight underline, a phase-aware tint (warm amber by day, cold sky by
	// night), and a trailing ArrowUpRight that signals "leaves the site".
	const isAnchor = href.startsWith("#");
	if (isAnchor) {
		return (
			<a
				href={href}
				className="italic font-bold underline decoration-wavy underline-offset-2 hover:opacity-70 transition-opacity"
			>
				{children}
			</a>
		);
	}
	const tint = isNight ? "text-sky-300" : "text-amber-700";
	return (
		<a
			href={href}
			target="_blank"
			rel="noopener noreferrer"
			className={`font-bold underline decoration-2 underline-offset-2 hover:opacity-70 transition-opacity ${tint}`}
		>
			{children}
			<ArrowUpRight
				size={14}
				aria-hidden="true"
				className="inline-block align-baseline ml-0.5"
			/>
		</a>
	);
}

export type BulletItem = {
	primary: string;
	secondary?: string;
	Icon?: ComponentType<{ size?: number; color?: string; className?: string }>;
};

export function BulletList({
	label,
	items,
}: {
	label?: string;
	items: BulletItem[];
}) {
	return (
		<div>
			{label && (
				<p className="text-xs font-black uppercase tracking-[0.3em] opacity-70 mb-3">
					{label}
				</p>
			)}
			<ul className="space-y-2 text-base md:text-lg leading-relaxed">
				{items.map((item) => (
					<li key={item.primary} className="flex gap-3">
						{item.Icon ? (
							<item.Icon
								size={18}
								className="shrink-0 opacity-70 mt-1"
								aria-hidden="true"
							/>
						) : (
							<span
								className="font-black opacity-60 shrink-0"
								aria-hidden="true"
							>
								›
							</span>
						)}
						<span>
							<span className="font-bold">{item.primary}</span>
							{item.secondary && (
								<span className="opacity-80"> {item.secondary}</span>
							)}
						</span>
					</li>
				))}
			</ul>
		</div>
	);
}

/**
 * Default state uses a muted 30% mix of `brand` against white; on hover the
 * button flips to the full-saturation `brand` color with white text + icon.
 */
function brandTintStyle(brand: string, isNight: boolean): React.CSSProperties {
	return {
		"--btn-tint": isNight
			? `color-mix(in srgb, ${brand} 22%, #0f172a)`
			: `color-mix(in srgb, ${brand} 30%, white)`,
		"--btn-tint-hover": brand,
		"--btn-text-hover": "#ffffff",
		"--icon-c": brand,
	} as React.CSSProperties;
}

const EXTERNAL_CARD_CLASS =
	"btn-brutalist group block w-full text-left p-6 md:p-7 font-black uppercase tracking-wider";

const TRIGGER_CARD_CLASS =
	"group w-full text-left px-6 md:px-7 py-16 md:py-20 font-black uppercase tracking-wider text-amber-50 cursor-pointer select-none";

const TRIGGER_GLOW_COLORS = ["#fbbf24", "#f59e0b", "#fb923c"]; // gold -> amber -> soft orange
const TRIGGER_GLOW_COLOR = "40 95 55"; // warm molten-ember edge light (H S L)
const TRIGGER_GLOW_BG = "#160F0A"; // warm near-black card so amber pops; tunable

function GlowTrigger({
	onActivate,
	className,
	children,
	"aria-label": ariaLabel,
}: {
	onActivate: (el: HTMLElement) => void;
	className: string;
	children: ReactNode;
	"aria-label"?: string;
}) {
	return (
		<BorderGlow
			as="button"
			type="button"
			aria-label={ariaLabel}
			onClick={(e) => onActivate(e.currentTarget)}
			borderRadius={0}
			edgeSensitivity={24}
			edgeFloor={70}
			glowIntensity={1.8}
			glowRadius={64}
			coneSpread={34}
			fillOpacity={0.8}
			colors={TRIGGER_GLOW_COLORS}
			glowColor={TRIGGER_GLOW_COLOR}
			backgroundColor={TRIGGER_GLOW_BG}
			className={className}
			style={{
				border: "4px solid rgba(251, 191, 36, 0.35)",
				boxShadow: "6px 6px 0 0 #0f172a",
			}}
		>
			{children}
		</BorderGlow>
	);
}

export function ExternalCard({
	href,
	label,
	Icon,
	brand,
	badge,
	isNight,
}: {
	href: string;
	label: string;
	Icon: ComponentType<{ size?: number; color?: string; className?: string }>;
	brand: string;
	badge?: string;
	isNight: boolean;
}) {
	return (
		<a
			href={href}
			target="_blank"
			rel="noopener noreferrer"
			style={brandTintStyle(brand, isNight)}
			className={`${EXTERNAL_CARD_CLASS}${isNight ? " btn-brutalist--night" : ""}`}
		>
			{badge && (
				<span className="absolute -top-2 right-4 z-10 pointer-events-none font-mono text-xs md:text-sm font-bold leading-tight uppercase tracking-[0.15em] -rotate-3 border-2 border-slate-900 bg-[#D51007] text-white px-2.5 py-1 shadow-[3px_3px_0_0_#0f172a] transition-colors duration-200 group-hover:bg-white group-hover:text-slate-900">
					{badge}
				</span>
			)}
			<div className="flex items-center justify-between gap-5">
				<span className="flex items-center gap-4 min-w-0">
					<span
						className="w-14 h-14 flex items-center justify-center border-2 border-slate-900 shrink-0"
						style={{
							backgroundColor: `color-mix(in srgb, ${brand} 25%, white)`,
							color: brand,
						}}
					>
						<Icon size={26} color="currentColor" />
					</span>
					<span className="block text-2xl md:text-3xl font-black uppercase leading-none truncate">
						{label}
					</span>
				</span>
				<ArrowRight
					size={28}
					className="shrink-0 transition-transform group-hover:translate-x-1"
				/>
			</div>
		</a>
	);
}

function TriggerCardBody({
	Icon,
	title,
	subtitle,
	tileClass,
	arrowSide,
}: {
	Icon: ComponentType<{ size?: number; color?: string; className?: string }>;
	title: string;
	subtitle?: string;
	tileClass: string;
	arrowSide: "left" | "right";
}) {
	const Arrow = arrowSide === "left" ? ArrowLeft : ArrowRight;
	const arrowMotion =
		arrowSide === "left"
			? "group-hover:-translate-x-1"
			: "group-hover:translate-x-1";
	return (
		<div className="flex items-center justify-between gap-5">
			<span className="flex items-center gap-4 min-w-0">
				<span
					className={`w-14 h-14 ${tileClass} flex items-center justify-center border-2 border-slate-900 shrink-0`}
				>
					<Icon size={26} />
				</span>
				<span className="min-w-0">
					<span className="block text-2xl md:text-3xl font-black uppercase leading-none truncate">
						{title}
					</span>
					{subtitle && (
						<span className="block mt-1 text-xs md:text-sm font-medium normal-case opacity-75 line-clamp-1">
							{subtitle}
						</span>
					)}
				</span>
			</span>
			<Arrow
				size={28}
				className={`shrink-0 transition-transform ${arrowMotion}`}
			/>
		</div>
	);
}

export function TriggerCard({
	trigger,
	lastTriggerRef,
}: {
	trigger: Trigger;
	lastTriggerRef: React.RefObject<HTMLElement | null>;
}) {
	const navigate = useNavigate();

	if (trigger.kind === "career") {
		const go = (el: HTMLElement | null) => {
			lastTriggerRef.current = el;
			navigate({ to: "/career", resetScroll: false });
		};
		return (
			<GlowTrigger
				onActivate={go}
				aria-label="See the work history"
				className="group w-full text-left px-6 py-16 font-black uppercase tracking-tighter text-amber-50 cursor-pointer select-none"
			>
				<div className="flex items-center justify-between gap-6 text-xl md:text-3xl">
					<ArrowLeft size={32} className="shrink-0" />
					<span>See the work history</span>
				</div>
			</GlowTrigger>
		);
	}

	if (trigger.kind === "project") {
		const project = PROJECTS.find((p) => p.slug === trigger.slug);
		if (!project) return null;
		const Icon = PROJECT_ICONS[project.iconKey];
		const go = (el: HTMLElement | null) => {
			lastTriggerRef.current = el;
			navigate({
				to: "/projects/$slug",
				params: { slug: project.slug },
				resetScroll: false,
			});
		};
		return (
			<GlowTrigger onActivate={go} className={TRIGGER_CARD_CLASS}>
				<TriggerCardBody
					Icon={Icon}
					title={project.title}
					subtitle={project.desc}
					tileClass={project.panelLight}
					arrowSide={PANEL_SIDES[project.slug]}
				/>
			</GlowTrigger>
		);
	}

	if (trigger.kind === "personal" || trigger.kind === "story") {
		const item =
			trigger.kind === "personal"
				? PERSONAL_BY_SLUG[trigger.slug]
				: STORY_BY_SLUG[trigger.slug];
		const go = (el: HTMLElement | null) => {
			lastTriggerRef.current = el;
			navigate({ to: `/${item.slug}`, resetScroll: false });
		};
		return (
			<GlowTrigger onActivate={go} className={TRIGGER_CARD_CLASS}>
				<TriggerCardBody
					Icon={item.Icon}
					title={item.title}
					tileClass={`${item.tileBg} ${item.tileFg}`}
					arrowSide={PANEL_SIDES[item.slug]}
				/>
			</GlowTrigger>
		);
	}
}
