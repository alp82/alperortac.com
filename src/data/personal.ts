import {
	BookOpen,
	Heart,
	type LucideIcon,
	Megaphone,
	Music,
} from "lucide-react";
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
		slug: "learning",
		title: "Learning",
		Icon: BookOpen,
		tileBg: "bg-teal-100",
		tileFg: "text-teal-900",
		panelBg: "#134e4a",
		panelFg: "#f0fdfa",
	},
	{
		slug: "teaching",
		title: "Teaching",
		Icon: Megaphone,
		tileBg: "bg-amber-100",
		tileFg: "text-amber-900",
		panelBg: "#78350f",
		panelFg: "#fffbeb",
	},
	{
		slug: "family",
		title: "Family",
		Icon: Heart,
		tileBg: "bg-rose-100",
		tileFg: "text-rose-900",
		panelBg: "#881337",
		panelFg: "#fff1f2",
	},
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
