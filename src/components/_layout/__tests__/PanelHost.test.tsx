import { describe, expect, it } from "vitest";
import {
	PANEL_FALLBACK_COLOR,
	PROJECTS,
	type Project,
} from "../../../data/projects";
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
	highlight: false,
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
