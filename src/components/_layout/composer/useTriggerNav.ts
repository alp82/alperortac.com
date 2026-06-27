import { useNavigate } from "@tanstack/react-router";
import type { ComponentType } from "react";
import { PERSONAL_BY_SLUG } from "../../../data/personal";
import { PROJECT_ICONS, PROJECTS } from "../../../data/projects";
import { PANEL_SIDES } from "../../../data/sections";
import { STORY_BY_SLUG } from "../../../data/stories";
import type { Trigger } from "../../../data/topics";

/*
 * Shared nav helper for the composer.
 *
 * Inner styles each render trigger cards in their OWN visual form, but they all
 * share the production navigation contract: stash the clicked element on
 * lastTriggerRef (focus return), then navigate with resetScroll:false so the
 * slide-in panel opens over the journey.
 *
 * resolveTrigger() flattens a Trigger union into the display fields an inner
 * style needs (title / subtitle / icon / side / accent tile class), so inner
 * styles don't re-implement the project/personal/career lookup.
 */

export type ResolvedTrigger = {
	key: string;
	title: string;
	subtitle: string;
	Icon: ComponentType<{ size?: number; className?: string }>;
	/** Tailwind classes for a light icon tile (project/personal palette). */
	tileClass: string;
	/** Preferred slide-in side; inner styles may use it for alternating layouts. */
	side: "left" | "right";
	/** True for the Career trigger (the one locked-dark card in baseline). */
	isCareer: boolean;
	navigate: (el: HTMLElement | null) => void;
};

export function useTriggerNav(
	lastTriggerRef: React.RefObject<HTMLElement | null>,
) {
	const navigate = useNavigate();

	function resolveTrigger(trigger: Trigger, fallbackSubtitle: string) {
		if (trigger.kind === "career") {
			const go = (el: HTMLElement | null) => {
				lastTriggerRef.current = el;
				navigate({ to: "/career", resetScroll: false });
			};
			return {
				key: "career",
				title: "See the work history",
				subtitle: fallbackSubtitle,
				Icon: PROJECT_ICONS.Code2,
				tileClass: "bg-slate-800 text-slate-100",
				side: PANEL_SIDES.career,
				isCareer: true,
				navigate: go,
			} satisfies ResolvedTrigger;
		}

		if (trigger.kind === "project") {
			const project = PROJECTS.find((p) => p.slug === trigger.slug);
			if (!project) return null;
			const go = (el: HTMLElement | null) => {
				lastTriggerRef.current = el;
				navigate({
					to: "/projects/$slug",
					params: { slug: project.slug },
					resetScroll: false,
				});
			};
			return {
				key: project.slug,
				title: project.title,
				subtitle: project.desc,
				Icon: PROJECT_ICONS[project.iconKey],
				tileClass: project.panelLight,
				side: PANEL_SIDES[project.slug],
				isCareer: false,
				navigate: go,
			} satisfies ResolvedTrigger;
		}

		if (trigger.kind === "personal") {
			const item = PERSONAL_BY_SLUG[trigger.slug];
			const go = (el: HTMLElement | null) => {
				lastTriggerRef.current = el;
				navigate({ to: `/${item.slug}`, resetScroll: false });
			};
			return {
				key: item.slug,
				title: item.title,
				subtitle: fallbackSubtitle,
				Icon: item.Icon,
				tileClass: `${item.tileBg} ${item.tileFg}`,
				side: PANEL_SIDES[item.slug],
				isCareer: false,
				navigate: go,
			} satisfies ResolvedTrigger;
		}

		// kind === "story"
		const story = STORY_BY_SLUG[trigger.slug];
		const go = (el: HTMLElement | null) => {
			lastTriggerRef.current = el;
			navigate({ to: `/${story.slug}`, resetScroll: false });
		};
		return {
			key: story.slug,
			title: story.title,
			subtitle: fallbackSubtitle,
			Icon: story.Icon,
			tileClass: `${story.tileBg} ${story.tileFg}`,
			side: PANEL_SIDES[story.slug],
			isCareer: false,
			navigate: go,
		} satisfies ResolvedTrigger;
	}

	return { resolveTrigger };
}
