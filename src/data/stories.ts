import { Clock, type LucideIcon } from "lucide-react";
import type { PanelKey } from "./sections";

/*
 * Stories are autobiographical-narrative panels triggered from topics on the
 * Craft band. Separate from `personal.ts` (life themes - learning, teaching,
 * family, music) because they carry real prose, get their own panel
 * components, and don't appear as topics on the band.
 */

export type StorySlug = Extract<PanelKey, "early-days">;

export type StoryEra = {
	age: string;
	ageSuffix: string;
	caption: string;
	beats: string[];
};

export type Story = {
	slug: StorySlug;
	title: string;
	Icon: LucideIcon;
	tileBg: string;
	tileFg: string;
	panelBg: string;
	panelFg: string;
	eras: StoryEra[];
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
		eras: [
			{
				age: "12",
				ageSuffix: "",
				caption: "QBasic · Turbo Pascal · Delphi",
				beats: [
					"I started coding with QBasic when I was 12. Built text adventures and generated PC speaker sounds.",
					"Then started to do a little bit of graphics with Turbo Pascal. Tried Delphi.",
				],
			},
			{
				age: "16",
				ageSuffix: "",
				caption: "SELFHTML · floppies · FastTracker",
				beats: [
					"Started to learn HTML and CSS when I was 16 and found my love for web development. No internet at home - my parents knew it would distract me from school, so I had to finish first.",
					"Used the school PCs to learn about SELFHTML, copied the pages to floppies to continue learning at home. Later JavaScript.",
					"Loved exploring possibilities - broke DOS and Windows often to experiment with systems. Did music via FastTracker, loved it.",
					"Got keys for the PC room at school. I was very responsible, and we played CS and StarCraft in the afternoons - my parents were proud that I was staying late at school because they thought I was learning.",
				],
			},
			{
				age: "19",
				ageSuffix: "",
				caption: "56k · the whole world",
				beats: ["Then internet. Mind blown."],
			},
			{
				age: "20",
				ageSuffix: "s",
				caption: "IRC · ICQ · LAN parties",
				beats: [
					"Was admin in a forum for my friends, we chatted via IRC and later ICQ. Also gaming and LAN-parties. Lots of gaming. My digital life has begun.",
				],
			},
		],
	},
];

export const STORY_BY_SLUG: Record<StorySlug, Story> = Object.fromEntries(
	STORIES.map((s) => [s.slug, s]),
) as Record<StorySlug, Story>;
