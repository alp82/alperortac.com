import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { ComponentType } from "react";
import { PERSONAL_BY_SLUG } from "../../data/personal";
import { PROJECT_ICONS, PROJECTS } from "../../data/projects";
import { PANEL_SIDES } from "../../data/sections";
import type { Trigger } from "../../data/topics";

type SectionTriggerCardProps = {
	trigger: Trigger;
	lastTriggerRef: React.RefObject<HTMLElement | null>;
	subtitle?: string;
};

type SidedCardProps = {
	iconClassName: string;
	Icon: ComponentType<{ size?: number }>;
	title: string;
	subtitle?: string | undefined;
	isRight: boolean;
	onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
};

function SidedCard({
	iconClassName,
	Icon,
	title,
	subtitle,
	isRight,
	onClick,
}: SidedCardProps) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={`group block w-full max-w-2xl bg-white text-slate-900 text-left p-6 md:p-8 border-4 border-slate-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-2 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all ${isRight ? "ml-auto" : "ml-0"}`}
		>
			<div className="flex items-center justify-between gap-6">
				<div className="flex items-center gap-5 min-w-0">
					{isRight && (
						<div
							className={`w-14 h-14 ${iconClassName} flex items-center justify-center border-2 border-slate-900 shrink-0`}
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
							{title}
						</h3>
						{subtitle && (
							<p className="text-sm text-slate-600 font-medium line-clamp-1">
								{subtitle}
							</p>
						)}
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
						className={`w-14 h-14 ${iconClassName} flex items-center justify-center border-2 border-slate-900 shrink-0`}
					>
						<Icon size={24} />
					</div>
				)}
			</div>
		</button>
	);
}

export function SectionTriggerCard({
	trigger,
	lastTriggerRef,
	subtitle,
}: SectionTriggerCardProps) {
	const navigate = useNavigate();

	if (trigger.kind === "career") {
		return (
			<button
				type="button"
				onClick={(e) => {
					lastTriggerRef.current = e.currentTarget;
					navigate({ to: "/career", resetScroll: false });
				}}
				className="w-full bg-slate-900 text-white p-6 md:p-8 border-4 border-slate-900 shadow-[8px_8px_0px_0px_rgba(255,255,255,0.4)] hover:-translate-y-1 transition-transform flex items-center justify-between gap-6 font-black uppercase tracking-tighter text-xl md:text-3xl"
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
		const isRight = PANEL_SIDES[project.slug] === "right";
		return (
			<SidedCard
				iconClassName={project.panelLight}
				Icon={Icon}
				title={project.title}
				subtitle={project.desc}
				isRight={isRight}
				onClick={(e) => {
					lastTriggerRef.current = e.currentTarget;
					navigate({
						to: "/projects/$slug",
						params: { slug: project.slug },
						resetScroll: false,
					});
				}}
			/>
		);
	}

	// kind === "personal"
	const item = PERSONAL_BY_SLUG[trigger.slug];
	const Icon = item.Icon;
	const isRight = PANEL_SIDES[item.slug] === "right";
	return (
		<SidedCard
			iconClassName={`${item.tileBg} ${item.tileFg}`}
			Icon={Icon}
			title={item.title}
			subtitle={subtitle}
			isRight={isRight}
			onClick={(e) => {
				lastTriggerRef.current = e.currentTarget;
				navigate({ to: `/${item.slug}`, resetScroll: false });
			}}
		/>
	);
}
