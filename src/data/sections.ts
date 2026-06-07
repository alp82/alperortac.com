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
	{ id: "find-me", label: "Find Me" },
	{ id: "craft", label: "Craft" },
	{ id: "contact", label: "Collab" },
] as const;

export const SECTION_IDS = {
	start: "start",
	findMe: "find-me",
	craft: "craft",
	contact: "contact",
	footer: "footer",
} as const;
