import { type LucideIcon, Music } from "lucide-react";
import type { PersonalSlug } from "./topics";

export type Personal = {
	slug: PersonalSlug;
	title: string;
	Icon: LucideIcon;
	tileBg: string;
	tileFg: string;
	panelBg: string;
	panelFg: string;
};

export const PERSONAL: Personal[] = [
	{
		slug: "music",
		title: "Music",
		Icon: Music,
		tileBg: "bg-indigo-100",
		tileFg: "text-indigo-900",
		panelBg: "#312e81",
		panelFg: "#eef2ff",
	},
];

export const PERSONAL_BY_SLUG: Record<PersonalSlug, Personal> =
	Object.fromEntries(PERSONAL.map((p) => [p.slug, p])) as Record<
		PersonalSlug,
		Personal
	>;
