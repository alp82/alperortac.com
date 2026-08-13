export const HERO_SUMMARY: readonly string[] = [
	"Web enthusiast and agentic coach with a side-project habit and a camera.",
	"Powered by passion and here to build genuinely authentic experiences.",
];

// Tooltip glosses for the two role terms in HERO_SUMMARY line 1. Each term
// string must appear verbatim in HERO_SUMMARY[0] - HeroSubtitle splits the
// line on them. tipBold is the highlighted plain-terms role name.
export interface HeroTerm {
	readonly term: string;
	readonly tipPre: string;
	readonly tipBold: string;
	readonly tipPost: string;
}

export const HERO_TERMS: readonly HeroTerm[] = [
	{
		term: "Web enthusiast",
		tipPre: "In plain terms: a ",
		tipBold: "software engineer",
		tipPost:
			" focused on web development. I build for the browser, at work and for fun.",
	},
	{
		term: "agentic coach",
		tipPre: "In plain terms: a ",
		tipBold: "tech consultant",
		tipPost: ", specialized in AI agents and how teams work with them.",
	},
];

export const HERO_CTA = "Scroll to learn more about me";

export const OG_HEADLINE = "HEY, I'M ALPER.";
export const OG_TAGLINE = "Web enthusiast, powered by passion";
