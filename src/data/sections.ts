export type PanelKey =
	| "sky"
	| "career"
	| "early-days"
	| "goodwatch"
	| "aistack"
	| "alpriver"
	| "manaschmiede"
	| "music";

export const PANEL_SIDES: Record<Exclude<PanelKey, "sky">, "left" | "right"> = {
	career: "left",
	"early-days": "right",
	goodwatch: "left",
	aistack: "right",
	alpriver: "left",
	manaschmiede: "right",
	music: "left",
};

export const MINIMAP_BOUNDARIES = [
	{ id: "linktree", label: "Linktree" },
	{ id: "craft", label: "Craft" },
	{ id: "cta", label: "Collab" },
] as const;

export const SECTION_IDS = {
	hero: "hero",
	linktree: "linktree",
	craft: "craft",
	cta: "cta",
	footer: "footer",
} as const;
