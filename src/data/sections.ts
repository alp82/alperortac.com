export type PanelKey =
	| "sky"
	| "career"
	| "early-days"
	| "goodwatch"
	| "aistack"
	| "alpriver"
	| "manaschmiede"
	| "music";

// Body class toggled while any panel (sky or detail) is open. Written by
// PanelHost, read by SectionTitle's fonts.ready re-seed guard — shared here
// so a rename can't silently desync the two. The CSS selectors in
// styles.css (`.panel-open`) must keep matching this literal by hand; CSS
// can't consume a JS constant.
export const PANEL_OPEN_CLASS = "panel-open";

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
	findMe: "find-me",
	craft: "craft",
	contact: "contact",
} as const;

// Smooth-scrolls to the page top (the hero). Smoothness comes from the global
// `html { scroll-behavior: smooth }` rule, not an explicit behavior option.
// Also clears any URL fragment left over from a section anchor, while
// preserving the pathname and any search params.
export function scrollToTop() {
	window.scrollTo({ top: 0 });
	if (window.location.hash) {
		history.replaceState(
			null,
			"",
			window.location.pathname + window.location.search,
		);
	}
}

// Shared click handler for the "back to top" links (logo, "Start", "To the
// sky"). Lets modified clicks (Cmd/Ctrl/Shift/Alt) fall through to native
// link behavior (new tab/window) instead of hijacking them into an in-page
// scroll.
export function handleScrollTopClick(e: {
	metaKey: boolean;
	ctrlKey: boolean;
	shiftKey: boolean;
	altKey: boolean;
	preventDefault: () => void;
}) {
	if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
	e.preventDefault();
	scrollToTop();
}
