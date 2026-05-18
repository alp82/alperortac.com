export type PanelKey =
	| "sky"
	| "career"
	| "goodwatch"
	| "aistack"
	| "alpriver"
	| "manaschmiede";

export const MINIMAP_BOUNDARIES = [
	{ id: "linktree", label: "Linktree" },
	{ id: "story", label: "Story" },
	{ id: "projects", label: "Projects" },
	{ id: "cta", label: "Collab" },
] as const;

export const SECTION_IDS = {
	hero: "hero",
	linktree: "linktree",
	story: "story",
	projects: "projects",
	cta: "cta",
	footer: "footer",
} as const;
