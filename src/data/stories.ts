import { Clock, type LucideIcon } from "lucide-react";
import type { PanelKey } from "./sections";

/*
 * Stories are autobiographical-narrative panels triggered from topics on the
 * Craft band. Separate from `personal.ts` (life themes — learning, teaching,
 * family, music) because they carry real prose, get their own panel
 * components, and don't appear as topics on the band.
 */

export type StorySlug = Extract<PanelKey, "early-days">;

export type Story = {
	slug: StorySlug;
	title: string;
	Icon: LucideIcon;
	tileBg: string;
	tileFg: string;
	panelBg: string;
	panelFg: string;
};

export const STORIES: Story[] = [
	{
		slug: "early-days",
		title: "The Early Days",
		Icon: Clock,
		tileBg: "bg-orange-100",
		tileFg: "text-orange-900",
		panelBg: "#7c2d12",
		panelFg: "#fff7ed",
	},
];

export const STORY_BY_SLUG: Record<StorySlug, Story> = Object.fromEntries(
	STORIES.map((s) => [s.slug, s]),
) as Record<StorySlug, Story>;
