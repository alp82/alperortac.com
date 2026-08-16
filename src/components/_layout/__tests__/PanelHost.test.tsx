import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
	PANEL_FALLBACK_COLOR,
	PROJECTS,
	type Project,
} from "../../../data/projects";
import { COVERING_PANELS, PANEL_COVERED_CLASS } from "../../../data/sections";
import { projectPanelStyle } from "../PanelHost";

// Card-core-only fixture: no test renders the full PanelHost (it needs the
// router, refs, and celestial state), so the --panel-bg fallback is pinned on
// the extracted style object instead. The fixture is synthetic because the
// real stubs now carry their own band tints - the TYPE still allows omitting
// panelColor, and this is the one consumer of that optionality neither tsc
// nor any rendering test guards (React drops an undefined custom property, so
// the CSS fallback `var(--panel-bg, #fff)` would paint white behind the
// hardcoded `--panel-fg: #fff` - white-on-white text).
const cardCoreOnly: Project = {
	slug: "curia",
	title: "Curia",
	desc: "AI chamber for the modern engineer.",
	link: "https://github.com/alp82/curia",
	status: "building",
	group: "tools",
	tags: ["AI", "Open Source"],
	color: "bg-cyan-100 text-cyan-800",
	iconKey: "Landmark",
};

const styleVars = (p: Project) =>
	projectPanelStyle(p) as Record<string, string | undefined>;

describe("projectPanelStyle (--panel-bg fallback)", () => {
	it("resolves --panel-bg to PANEL_FALLBACK_COLOR for a payload-less project (never undefined)", () => {
		const style = styleVars(cardCoreOnly);
		expect(style["--panel-bg"]).toBeDefined();
		expect(style["--panel-bg"]).toBe(PANEL_FALLBACK_COLOR);
	});

	it("passes an authored panelColor through unchanged", () => {
		const style = styleVars({ ...cardCoreOnly, panelColor: "#7f1d1d" });
		expect(style["--panel-bg"]).toBe("#7f1d1d");
	});

	it("always pairs --panel-bg with the hardcoded white foreground", () => {
		expect(styleVars(cardCoreOnly)["--panel-fg"]).toBe("#fff");
	});

	// Data-level backstop: every REAL project's surface must resolve to a
	// defined color too, whatever mix of authored tints and fallbacks the
	// data carries at any point in time.
	it("resolves a defined --panel-bg for every real PROJECTS entry", () => {
		for (const p of PROJECTS) {
			expect(
				styleVars(p)["--panel-bg"],
				`undefined --panel-bg for project "${p.slug}"`,
			).toBeDefined();
		}
	});
});

// The #60 carve-out: a covering panel pauses the hidden scene + main shell.
// PanelHost toggles the class from the JS constant, but the CSS selector is a
// hand-written literal - this pins the two to the same string, and pins the
// covering set itself so a new panel key cannot slip in silently unstyled.
describe("covering panels (#60 carve-out)", () => {
	const css = readFileSync(
		new URL("../../../styles.css", import.meta.url),
		"utf8",
	);

	it("pauses both the scene and the main shell under the SAME literal PanelHost toggles", () => {
		expect(css).toContain(`body.${PANEL_COVERED_CLASS} .dive-viewport *`);
		expect(css).toContain(`body.${PANEL_COVERED_CLASS} .main-shell *`);
	});

	it("covers exactly the fullscreen subpages - today: travel", () => {
		expect([...COVERING_PANELS]).toEqual(["travel"]);
	});
});
