export type PanelKey =
	| "sky"
	| "career"
	| "goodwatch"
	| "aistack"
	| "alpriver"
	| "manaschmiede"
	| "learning"
	| "teaching"
	| "family"
	| "music";

export const PANEL_SIDES: Record<Exclude<PanelKey, "sky">, "left" | "right"> = {
	career: "left",
	goodwatch: "left",
	aistack: "right",
	alpriver: "left",
	manaschmiede: "right",
	learning: "right",
	teaching: "left",
	family: "right",
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
