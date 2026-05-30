import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { TRIGGERS_ENABLED } from "../../../data/flags";
import { PERSONAL_BY_SLUG } from "../../../data/personal";
import { PROJECT_ICONS, PROJECTS } from "../../../data/projects";
import { PANEL_SIDES } from "../../../data/sections";
import { STORY_BY_SLUG } from "../../../data/stories";
import type { Trigger } from "../../../data/topics";

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
 * The frosted "voice surface" that wraps a topic's body. Inverts at night so
 * prose stays readable against the dusk/night sky. Used by both the baseline
 * CurrentBlock dispatch and the DEV composer's promoted-topic Stage wrapper.
 */
export function TopicPlate({
	isNight,
	children,
	className = "",
}: {
	isNight: boolean;
	children: ReactNode;
	className?: string;
}) {
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
}: {
	href: string;
	children: ReactNode;
}) {
	// Anchors (#topic-foo) scroll within the page; everything else opens in a
	// new tab.
	const isAnchor = href.startsWith("#");
	return (
		<a
			href={href}
			target={isAnchor ? undefined : "_blank"}
			rel={isAnchor ? undefined : "noopener noreferrer"}
			className="font-bold underline decoration-2 underline-offset-2 hover:opacity-70 transition-opacity"
		>
			{children}
		</a>
	);
}

export type BulletItem = { primary: string; secondary?: string };

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
						<span className="font-black opacity-60 shrink-0" aria-hidden="true">
							›
						</span>
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
function brandTintStyle(brand: string): React.CSSProperties {
	return {
		"--btn-tint": `color-mix(in srgb, ${brand} 30%, white)`,
		"--btn-tint-hover": brand,
		"--btn-text-hover": "#ffffff",
		"--icon-c": brand,
	} as React.CSSProperties;
}

const EXTERNAL_CARD_CLASS =
	"btn-brutalist group block w-full text-left p-6 md:p-7 font-black uppercase tracking-wider";

const TRIGGER_CARD_CLASS =
	"btn-brutalist group block w-full md:w-1/2 text-left p-6 md:p-7 font-black uppercase tracking-wider";

export function ExternalCard({
	href,
	label,
	Icon,
	brand,
}: {
	href: string;
	label: string;
	Icon: ComponentType<{ size?: number; color?: string; className?: string }>;
	brand: string;
}) {
	return (
		<a
			href={href}
			target="_blank"
			rel="noopener noreferrer"
			style={brandTintStyle(brand)}
			className={EXTERNAL_CARD_CLASS}
		>
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
	if (!TRIGGERS_ENABLED) return null;

	if (trigger.kind === "career") {
		const go = (el: HTMLElement | null) => {
			lastTriggerRef.current = el;
			navigate({ to: "/career", resetScroll: false });
		};
		return (
			<button
				type="button"
				onClick={(e) => go(e.currentTarget)}
				className="btn-brutalist btn-brutalist--dark w-full flex items-center justify-between gap-6 font-black uppercase tracking-tighter text-xl md:text-3xl p-6"
			>
				<ArrowLeft size={32} className="shrink-0" />
				<span>See the work history</span>
			</button>
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
			<button
				type="button"
				onClick={(e) => go(e.currentTarget)}
				style={brandTintStyle(project.panelColor)}
				className={TRIGGER_CARD_CLASS}
			>
				<TriggerCardBody
					Icon={Icon}
					title={project.title}
					subtitle={project.desc}
					tileClass={project.panelLight}
					arrowSide={PANEL_SIDES[project.slug]}
				/>
			</button>
		);
	}

	if (trigger.kind === "personal") {
		const item = PERSONAL_BY_SLUG[trigger.slug];
		const go = (el: HTMLElement | null) => {
			lastTriggerRef.current = el;
			navigate({ to: `/${item.slug}`, resetScroll: false });
		};
		return (
			<button
				type="button"
				onClick={(e) => go(e.currentTarget)}
				style={brandTintStyle(item.panelBg)}
				className={TRIGGER_CARD_CLASS}
			>
				<TriggerCardBody
					Icon={item.Icon}
					title={item.title}
					tileClass={`${item.tileBg} ${item.tileFg}`}
					arrowSide={PANEL_SIDES[item.slug]}
				/>
			</button>
		);
	}

	// kind === "story"
	const story = STORY_BY_SLUG[trigger.slug];
	const go = (el: HTMLElement | null) => {
		lastTriggerRef.current = el;
		navigate({ to: `/${story.slug}`, resetScroll: false });
	};
	return (
		<button
			type="button"
			onClick={(e) => go(e.currentTarget)}
			style={brandTintStyle(story.panelBg)}
			className={TRIGGER_CARD_CLASS}
		>
			<TriggerCardBody
				Icon={story.Icon}
				title={story.title}
				tileClass={`${story.tileBg} ${story.tileFg}`}
				arrowSide={PANEL_SIDES[story.slug]}
			/>
		</button>
	);
}
