export type PanelKey =
	| "sky"
	| "career"
	| "early-days"
	| "goodwatch"
	| "aistack"
	| "forge"
	| "manaschmiede"
	| "music"
	| "movies"
	| "travel";

// Body class toggled while any panel (sky or detail) is open. Written by
// PanelHost, read by SectionTitle's fonts.ready re-seed guard - shared here
// so a rename can't silently desync the two. The CSS selectors in
// styles.css (`.panel-open`) must keep matching this literal by hand; CSS
// can't consume a JS constant.
export const PANEL_OPEN_CLASS = "panel-open";

export const PANEL_SIDES: Record<Exclude<PanelKey, "sky">, "left" | "right"> = {
	career: "left",
	"early-days": "right",
	goodwatch: "left",
	aistack: "right",
	forge: "left",
	manaschmiede: "right",
	music: "left",
	// GoodWatch on the same band slides left; the second destination takes the
	// opposite side so the dive aim reads distinct.
	movies: "right",
	// Matches the ticket-stub route strip's travel direction (next leg points
	// right toward JPN '27).
	travel: "right",
};

export const MINIMAP_BOUNDARIES = [
	{ id: "socials", label: "Socials" },
	{ id: "craft", label: "Craft" },
	{ id: "contact", label: "Collab" },
] as const;

export const SECTION_IDS = {
	findMe: "socials",
	craft: "craft",
	contact: "contact",
} as const;

// Opt the NEXT scroll into smooth motion. Adds the class the CSS smooth rule
// keys on (`html.smooth-scroll`, itself gated behind prefers-reduced-motion),
// then drops it once the scroll settles. Only user-initiated scrolls arm it,
// so cold loads, hash-on-load, and back/forward restoration - which never call
// this - always land instantly. Reduced-motion users stay instant because the
// gated CSS rule never matches, making the class a no-op for them.
export function armSmoothScroll() {
	if (typeof document === "undefined") return;
	const root = document.documentElement;
	root.classList.add("smooth-scroll");
	const disarm = () => {
		root.classList.remove("smooth-scroll");
		window.removeEventListener("scrollend", disarm);
	};
	// scrollend fires when the smooth scroll finishes; the timeout is the
	// fallback for browsers without scrollend or when no scroll actually occurs.
	window.addEventListener("scrollend", disarm);
	window.setTimeout(disarm, 1200);
}

// True when a click should arm smooth scrolling: a plain left-click (no
// modifier keys, not already handled) on a same-page hash anchor. Extracted as
// a pure predicate so the arming rule is unit-testable and the in-app-click
// listener in _layout stays a one-liner.
export function shouldArmSmoothForClick(e: MouseEvent): boolean {
	if (
		e.defaultPrevented ||
		e.button !== 0 ||
		e.metaKey ||
		e.ctrlKey ||
		e.shiftKey ||
		e.altKey
	) {
		return false;
	}
	const anchor = (e.target as Element | null)?.closest("a");
	const href = anchor?.getAttribute("href");
	return !!href && href.startsWith("#") && href !== "#";
}

// Smooth-scrolls to the page top (the hero). Arms smooth for this gesture; the
// scrollTo itself uses the CSS scroll-behavior (smooth only while armed).
// Also clears any URL fragment left over from a section anchor, while
// preserving the pathname and any search params.
export function scrollToTop() {
	armSmoothScroll();
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
