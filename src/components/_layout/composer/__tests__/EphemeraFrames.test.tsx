// @vitest-environment jsdom

/*
 * Four ephemera frames (wayfinder plan-four-ephemera-frames) - registry (B),
 * per-frame component behavior (E/F/G/H), stock-driven custom-property
 * regression (J-extra), and the identity-lock regression guard (K2).
 *
 * Authored red: none of "timecard" / "nameplate" / "punch-card" /
 * "offer-letter" exist in `INNERS` yet, so every `INNERS[id]` lookup below is
 * `undefined` and every render throws reading `.Component`/`.defaults` off it.
 *
 * Section A (the InnerId union, the four *Params types, the InnerParamsMap
 * rows, AnyInnerParams, and an INNERS defaults object missing a required
 * field) is a pure compile-time contract - `tsc` fails the build on a missing
 * union member, map row, or defaults field. No runtime test can fabricate an
 * equivalent for a type that doesn't type-check; left to `tsc`, not asserted
 * here (same convention as identities.test.ts's TC-A3-A6 notes).
 *
 * Section D (render harness) lives in TopicComposition.test.tsx's
 * "ephemera inners render through TopicComposition" block, reusing the file's
 * existing `renderCompositionWithInner` harness per the plan's structural note.
 */

import { cleanup, render } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it } from "vitest";
import type { Topic } from "../../../../data/topics";
import { TOPICS } from "../../../../data/topics";
import { IDENTITIES } from "../identities";
import { INNERS } from "../index";
import type { InnerId, InnerRenderProps } from "../types";

const topic: Topic = {
	id: "career",
	heading: "Career",
	teaser: "ignored",
	triggers: [],
};

const otherTopic: Topic = {
	id: "travel",
	heading: "Travel",
	teaser: "ignored",
	triggers: [],
};

const lastTriggerRef = createRef<HTMLElement>();
const BODY_TEXT = "real body";

const EPHEMERA_IDS = [
	"timecard",
	"nameplate",
	"punch-card",
	"offer-letter",
] as const;

/** The nameplate's engraved role-line wordings, keyed by preset. `title` is
 * the user's verbatim role line (wayfinder plan-career-nameplate-lock);
 * tenure/focus stay placeholders. Plain "-" only, never an em dash. */
const ROLE_LABELS = {
	title: "Engineer, founder, consultant",
	tenure: "SINCE - YEAR",
	focus: "FOCUS - AREA",
} as const;

/** Parses a CSS color that jsdom/cssstyle may hand back as "#rrggbb" OR as the
 * normalized "rgb(r, g, b)" form on inline-style read-back. */
function parseColor(value: string): [number, number, number] {
	const v = value.trim();
	const rgb = v.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
	if (rgb) {
		return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
	}
	const hex = v.replace("#", "");
	const full =
		hex.length === 3
			? hex
					.split("")
					.map((c) => c + c)
					.join("")
			: hex;
	return [
		Number.parseInt(full.slice(0, 2), 16),
		Number.parseInt(full.slice(2, 4), 16),
		Number.parseInt(full.slice(4, 6), 16),
	];
}

/** sRGB channel (0..255) to its linearized value. */
function linearizeChannel(c: number): number {
	const s = c / 255;
	return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

/** WCAG relative luminance of an sRGB triple. */
function relativeLuminance([r, g, b]: [number, number, number]): number {
	return (
		0.2126 * linearizeChannel(r) +
		0.7152 * linearizeChannel(g) +
		0.0722 * linearizeChannel(b)
	);
}

/** WCAG contrast ratio (L_light + 0.05) / (L_dark + 0.05) for two CSS colors. */
function contrastRatio(a: string, b: string): number {
	const la = relativeLuminance(parseColor(a));
	const lb = relativeLuminance(parseColor(b));
	return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Renders one ephemera cluster straight off the INNERS registry, merging
 * `overrides.params` onto that id's own registry defaults. */
function renderFrame<Id extends InnerId>(
	id: Id,
	overrides: {
		params?: Partial<InnerRenderProps<Id>["params"]>;
		topic?: Topic;
		index?: number;
		accent?: string;
	} = {},
) {
	const def = INNERS[id];
	const Cluster = def.Component as React.ComponentType<InnerRenderProps<Id>>;
	const params = {
		...def.defaults,
		...overrides.params,
	} as InnerRenderProps<Id>["params"];
	return render(
		<Cluster
			topic={overrides.topic ?? topic}
			index={overrides.index ?? 0}
			isNight={false}
			lastTriggerRef={lastTriggerRef}
			params={params}
			accent={overrides.accent ?? "#a7f3d0"}
		>
			<p data-testid="body">{BODY_TEXT}</p>
		</Cluster>,
	);
}

afterEach(() => {
	cleanup();
});

describe("B - INNERS registry for the four ephemera frames", () => {
	it.each(EPHEMERA_IDS)("INNERS[%s].id === %s", (id) => {
		expect(INNERS[id]?.id).toBe(id);
	});

	it.each([
		["timecard", "Timecard"],
		["nameplate", "Nameplate"],
		["punch-card", "Punch Card"],
		["offer-letter", "Offer Letter"],
	] as const)("%s has a non-empty human-readable label", (id, label) => {
		const def = INNERS[id];
		expect(def.label.length).toBeGreaterThan(0);
		expect(def.label).toBe(label);
	});

	it.each(
		EPHEMERA_IDS,
	)("%s's .feel is non-empty and contains no em dash", (id) => {
		const def = INNERS[id];
		expect(def.feel.length).toBeGreaterThan(0);
		expect(def.feel).not.toContain("—");
	});

	it.each(EPHEMERA_IDS)('%s\'s .surface === "light"', (id) => {
		expect(INNERS[id].surface).toBe("light");
	});

	it("timecard defaults deep-equal { density: roomy, stamps: true, stock: manila }", () => {
		expect(INNERS.timecard.defaults).toEqual({
			density: "roomy",
			stamps: true,
			stock: "manila",
		});
	});

	it("nameplate defaults deep-equal { density: roomy, screws: true, role: title }", () => {
		expect(INNERS.nameplate.defaults).toEqual({
			density: "roomy",
			screws: true,
			role: "title",
		});
	});

	it("punch-card defaults deep-equal { density: roomy, holes: true, stock: manila }", () => {
		expect(INNERS["punch-card"].defaults).toEqual({
			density: "roomy",
			holes: true,
			stock: "manila",
		});
	});

	it("offer-letter defaults deep-equal { density: roomy, scrawl: true, stock: cream }", () => {
		expect(INNERS["offer-letter"].defaults).toEqual({
			density: "roomy",
			scrawl: true,
			stock: "cream",
		});
	});

	it.each(EPHEMERA_IDS)("%s's .Component is defined", (id) => {
		expect(INNERS[id].Component).toBeDefined();
	});

	it("B-7 - INNERS has no conference-badge key and no entry whose .id is conference-badge", () => {
		expect(Object.hasOwn(INNERS, "conference-badge")).toBe(false);
		for (const def of Object.values(INNERS)) {
			expect(def.id).not.toBe("conference-badge");
		}
	});
});

describe("E - Timecard", () => {
	it("E1 - stamps:true renders both IN and OUT stamp elements", () => {
		const { container } = renderFrame("timecard", { params: { stamps: true } });
		const text = container.textContent ?? "";
		expect(text).toMatch(/\bIN\b/);
		expect(text).toMatch(/\bOUT\b/);
	});

	it("E2 - stamps:false removes both stamp elements from the DOM entirely (not merely hidden)", () => {
		const { container } = renderFrame("timecard", {
			params: { stamps: false },
		});
		const text = container.textContent ?? "";
		expect(text).not.toMatch(/\bIN\b/);
		expect(text).not.toMatch(/\bOUT\b/);
	});

	it("E2b - the whole footer strip is gated on the toggle: stamps:true renders .timecard-foot AND its TIME CLOCK label; stamps:false removes BOTH (no orphaned chrome)", () => {
		// The label and the `·` divider live INSIDE the params.stamps conditional,
		// so they are part of the toggle's contract, not standalone chrome. Pinned
		// here so hoisting the label out of the conditional (leaving an empty
		// bordered strip behind when the stamps are off) fails loudly.
		const { container: on } = renderFrame("timecard", {
			params: { stamps: true },
		});
		expect(on.querySelector(".timecard-foot")).not.toBeNull();
		expect(on.textContent ?? "").toContain("TIME CLOCK");
		cleanup();

		const { container: off } = renderFrame("timecard", {
			params: { stamps: false },
		});
		expect(off.querySelector(".timecard-foot")).toBeNull();
		expect(off.textContent ?? "").not.toContain("TIME CLOCK");
	});

	it('E3 - "EMPLOYEE NO." eyebrow renders the 1-based index zero-padded to 2 (index 0 -> "01")', () => {
		const { container } = renderFrame("timecard", { index: 0 });
		expect(container.textContent).toContain("EMPLOYEE NO.");
		expect(container.textContent).toContain("01");
	});

	it("E4 - heading === topic.heading", () => {
		const { container } = renderFrame("timecard");
		expect(container.querySelector("h2")?.textContent).toBe(topic.heading);
	});

	it("E5 - each stock (manila/buff/ledger) renders and the three renders are not styled identically", () => {
		const outputs = (["manila", "buff", "ledger"] as const).map((stock) => {
			const { container } = renderFrame("timecard", { params: { stock } });
			const html = container.innerHTML;
			cleanup();
			return html;
		});
		expect(new Set(outputs).size).toBe(3);
	});

	it("E6 - the printed-rows decoration (.timecard-rows) is not a DOM ancestor of the children container", () => {
		const { container, getByTestId } = renderFrame("timecard");
		const body = getByTestId("body");
		const rows = container.querySelector(".timecard-rows");
		expect(rows).not.toBeNull();
		expect(rows?.contains(body)).toBe(false);
		expect(body.closest(".timecard-rows")).toBeNull();
	});

	it("E7 - density flows through to the DENSITY_MAXW wrapper class (cozy vs roomy differ)", () => {
		const { container: cozy } = renderFrame("timecard", {
			params: { density: "cozy" },
		});
		const cozyClass = (cozy.firstElementChild as HTMLElement | null)?.className;
		cleanup();
		const { container: roomy } = renderFrame("timecard", {
			params: { density: "roomy" },
		});
		const roomyClass = (roomy.firstElementChild as HTMLElement | null)
			?.className;
		expect(cozyClass).toContain("max-w-xl");
		expect(roomyClass).toContain("max-w-3xl");
		expect(cozyClass).not.toBe(roomyClass);
	});
});

describe("F - Nameplate", () => {
	it("F1 - screws:true renders the corner mount screws (.nameplate-screw)", () => {
		const { container } = renderFrame("nameplate", {
			params: { screws: true },
		});
		expect(container.querySelector(".nameplate-screw")).not.toBeNull();
	});

	it("F1b - screws:true renders exactly four .nameplate-screw spans", () => {
		const { container } = renderFrame("nameplate", {
			params: { screws: true },
		});
		expect(container.querySelectorAll(".nameplate-screw").length).toBe(4);
	});

	it("F2 - screws:false removes every .nameplate-screw from the DOM entirely (not merely hidden)", () => {
		const { container } = renderFrame("nameplate", {
			params: { screws: false },
		});
		expect(container.querySelectorAll(".nameplate-screw").length).toBe(0);
	});

	it("F2b - each .nameplate-screw carries aria-hidden=true", () => {
		const { container } = renderFrame("nameplate", {
			params: { screws: true },
		});
		const screws = container.querySelectorAll(".nameplate-screw");
		expect(screws.length).toBe(4);
		for (const screw of Array.from(screws)) {
			expect(screw.getAttribute("aria-hidden")).toBe("true");
		}
	});

	it("F2c - no .nameplate-screw is a DOM ancestor of the children body", () => {
		const { container, getByTestId } = renderFrame("nameplate", {
			params: { screws: true },
		});
		const body = getByTestId("body");
		for (const screw of Array.from(
			container.querySelectorAll(".nameplate-screw"),
		)) {
			expect(screw.contains(body)).toBe(false);
		}
		expect(body.closest(".nameplate-screw")).toBeNull();
	});

	it("F3 - the three role presets (title/tenure/focus) render distinct innerHTML", () => {
		const outputs = (["title", "tenure", "focus"] as const).map((role) => {
			const { container } = renderFrame("nameplate", { params: { role } });
			const html = container.innerHTML;
			cleanup();
			return html;
		});
		expect(new Set(outputs).size).toBe(3);
	});

	it("F3b - each role preset's exact ROLE label text appears in container.textContent", () => {
		for (const role of ["title", "tenure", "focus"] as const) {
			const { container } = renderFrame("nameplate", { params: { role } });
			expect(container.textContent).toContain(ROLE_LABELS[role]);
			cleanup();
		}
	});

	it("F3c - no rendered ROLE label contains an em dash", () => {
		for (const role of ["title", "tenure", "focus"] as const) {
			const { container } = renderFrame("nameplate", { params: { role } });
			expect(
				container.querySelector(".nameplate-role")?.textContent ?? "",
			).not.toContain("—");
			cleanup();
		}
	});

	it("F5 - heading === topic.heading", () => {
		const { container } = renderFrame("nameplate");
		expect(container.querySelector("h2")?.textContent).toBe(topic.heading);
	});

	it('F5b - the old badge eyebrow is gone: container.textContent contains no "HALL"', () => {
		const { container } = renderFrame("nameplate");
		expect(container.textContent ?? "").not.toContain("HALL");
	});

	it("F6 - the sheen (.nameplate-sheen) is aria-hidden, pointer-events:none, and not an ancestor of children", () => {
		const { container, getByTestId } = renderFrame("nameplate");
		const sheen = container.querySelector(
			".nameplate-sheen",
		) as HTMLElement | null;
		expect(sheen).not.toBeNull();
		expect(sheen?.getAttribute("aria-hidden")).toBe("true");
		expect(sheen?.style.pointerEvents).toBe("none");
		const body = getByTestId("body");
		expect(sheen?.contains(body)).toBe(false);
	});

	it("F6b - the sheen is always-on: .nameplate-sheen is present even with screws:false", () => {
		const { container } = renderFrame("nameplate", {
			params: { screws: false },
		});
		expect(container.querySelector(".nameplate-sheen")).not.toBeNull();
	});

	it("F7 - two topics with different accents produce different header-band styling", () => {
		const { container: a } = renderFrame("nameplate", {
			accent: "#a7f3d0",
		});
		const htmlA = a.innerHTML;
		cleanup();
		const { container: b } = renderFrame("nameplate", {
			accent: "#bfdbfe",
		});
		const htmlB = b.innerHTML;
		expect(htmlA).not.toBe(htmlB);
	});

	it("F8 - LOAD-BEARING a11y: the .nameplate-role bar carries light ink on a dark bar clearing WCAG AA 4.5:1", () => {
		const { container } = renderFrame("nameplate");
		const role = container.querySelector(
			".nameplate-role",
		) as HTMLElement | null;
		expect(role).not.toBeNull();
		// jsdom (cssstyle) normalizes inline hex to "rgb(r, g, b)" on read-back;
		// parseColor accepts either form.
		const fg = role?.style.color ?? "";
		const bg = role?.style.backgroundColor ?? "";
		expect(fg.length).toBeGreaterThan(0);
		expect(bg.length).toBeGreaterThan(0);
		expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(4.5);
	});

	it("F8b - the gate reads the role bar's OWN colors: a near-#0f172a dark-on-dark pair fails the same 4.5:1 gate", () => {
		const { container } = renderFrame("nameplate");
		const role = container.querySelector(
			".nameplate-role",
		) as HTMLElement | null;
		expect(role).not.toBeNull();
		const fg = role?.style.color ?? "";
		const bg = role?.style.backgroundColor ?? "";
		// Had the component inked near-#0f172a text on the #0f172a bar, the ratio
		// would collapse to ~1.0 - prove the gate has teeth on such a pair:
		expect(contrastRatio("#0f172a", "#111827")).toBeLessThan(4.5);
		// ...and confirm the REAL bar is light-ink-on-dark (bg darker than ink):
		expect(relativeLuminance(parseColor(bg))).toBeLessThan(
			relativeLuminance(parseColor(fg)),
		);
	});

	it("F8c - .nameplate-role textContent is non-empty and equals the active ROLE label", () => {
		const { container } = renderFrame("nameplate", {
			params: { role: "title" },
		});
		const role = container.querySelector(".nameplate-role");
		expect((role?.textContent ?? "").length).toBeGreaterThan(0);
		expect(role?.textContent).toBe(ROLE_LABELS.title);
	});
});

describe("G - Punch-card", () => {
	it("G1 - holes:true renders the punched-hole strip (.punchcard-holes)", () => {
		const { container } = renderFrame("punch-card", {
			params: { holes: true },
		});
		expect(container.querySelector(".punchcard-holes")).not.toBeNull();
	});

	it("G2 - holes:false removes the punched-hole strip from the DOM entirely", () => {
		const { container } = renderFrame("punch-card", {
			params: { holes: false },
		});
		expect(container.querySelector(".punchcard-holes")).toBeNull();
	});

	it("G3 - each stock (manila/salmon/mint) renders distinctly", () => {
		const outputs = (["manila", "salmon", "mint"] as const).map((stock) => {
			const { container } = renderFrame("punch-card", { params: { stock } });
			const html = container.innerHTML;
			cleanup();
			return html;
		});
		expect(new Set(outputs).size).toBe(3);
	});

	it("G3 - punch-card's manila render is not styled identically to timecard's manila render", () => {
		const { container: pc } = renderFrame("punch-card", {
			params: { stock: "manila" },
		});
		const pcHtml = pc.innerHTML;
		cleanup();
		const { container: tc } = renderFrame("timecard", {
			params: { stock: "manila" },
		});
		const tcHtml = tc.innerHTML;
		expect(pcHtml).not.toBe(tcHtml);
	});

	it('G4 - renders the exact footer literal "DO NOT FOLD, SPINDLE OR MUTILATE"', () => {
		const { container } = renderFrame("punch-card");
		expect(container.textContent).toContain("DO NOT FOLD, SPINDLE OR MUTILATE");
	});

	it("G5 - the digit-row bands (.punchcard-grid) are aria-hidden CSS decoration contributing no text to container.textContent", () => {
		const { container } = renderFrame("punch-card");
		const bands = container.querySelectorAll(".punchcard-grid");
		expect(bands.length).toBe(2);
		for (const band of Array.from(bands)) {
			expect(band.getAttribute("aria-hidden")).toBe("true");
			expect(band.textContent ?? "").toBe("");
		}
	});

	it("G5 - no digit soup anywhere in container.textContent, not just inside .punchcard-grid (a differently-classed span must not smuggle digits in either)", () => {
		const { container } = renderFrame("punch-card");
		expect(container.textContent ?? "").not.toMatch(/(?:\d[\s|]*){6}/);
	});

	it("G5 - the digit-row bands are never ancestors of the content field", () => {
		const { container, getByTestId } = renderFrame("punch-card");
		const body = getByTestId("body");
		for (const band of Array.from(
			container.querySelectorAll(".punchcard-grid"),
		)) {
			expect(band.contains(body)).toBe(false);
		}
	});

	it("G6 - heading + children sit in the clear center field, siblings of the decoration", () => {
		const { container, getByTestId } = renderFrame("punch-card");
		const body = getByTestId("body");
		const heading = container.querySelector("h2");
		expect(heading).not.toBeNull();
		const holes = container.querySelector(".punchcard-holes");
		const grid = container.querySelector(".punchcard-grid");
		expect(holes?.contains(heading)).toBe(false);
		expect(holes?.contains(body)).toBe(false);
		expect(grid?.contains(heading)).toBe(false);
		expect(grid?.contains(body)).toBe(false);
	});
});

describe("H - Offer-letter", () => {
	it("H1 - scrawl:true renders the signature block (SINCERELY eyebrow + Alper span)", () => {
		const { container } = renderFrame("offer-letter", {
			params: { scrawl: true },
		});
		expect(container.textContent).toContain("SINCERELY");
		expect(container.textContent).toContain("Alper");
	});

	it("H2 - scrawl:false removes the whole signature block from the DOM entirely", () => {
		const { container } = renderFrame("offer-letter", {
			params: { scrawl: false },
		});
		expect(container.textContent).not.toContain("SINCERELY");
		expect(container.textContent).not.toContain("Alper");
	});

	it("H3 - each stock (cream/ivory/dove) renders distinctly", () => {
		const outputs = (["cream", "ivory", "dove"] as const).map((stock) => {
			const { container } = renderFrame("offer-letter", { params: { stock } });
			const html = container.innerHTML;
			cleanup();
			return html;
		});
		expect(new Set(outputs).size).toBe(3);
	});

	it("H4 - the embossed monogram (.letter-monogram) renders the uppercased first letter of topic.heading, changing across two headings", () => {
		const { container: careerRender } = renderFrame("offer-letter", {
			topic,
		});
		const careerMonogram = careerRender.querySelector(".letter-monogram");
		expect(careerMonogram).not.toBeNull();
		expect(careerMonogram?.textContent).toBe("C");
		cleanup();
		const { container: travelRender } = renderFrame("offer-letter", {
			topic: otherTopic,
		});
		const travelMonogram = travelRender.querySelector(".letter-monogram");
		expect(travelMonogram).not.toBeNull();
		expect(travelMonogram?.textContent).toBe("T");
	});

	it("H5 - DETERMINISM: the date line carries no Date.now()/new Date() - two renders at the same index produce byte-identical text", () => {
		const { container: r1 } = renderFrame("offer-letter", { index: 3 });
		const text1 = r1.textContent ?? "";
		cleanup();
		const { container: r2 } = renderFrame("offer-letter", { index: 3 });
		const text2 = r2.textContent ?? "";
		expect(text1).toBe(text2);
	});

	it("H5b - the date line is derived from index, not wall-clock time: index 3 and index 7 produce DIFFERENT date text", () => {
		const { container: idx3 } = renderFrame("offer-letter", { index: 3 });
		const text3 = idx3.textContent ?? "";
		cleanup();
		const { container: idx7 } = renderFrame("offer-letter", { index: 7 });
		const text7 = idx7.textContent ?? "";
		expect(text3).not.toBe(text7);
	});

	it("H6 - heading === topic.heading", () => {
		const { container } = renderFrame("offer-letter");
		expect(container.querySelector("h2")?.textContent).toBe(topic.heading);
	});

	it("H7 - children render between the subject heading and the signature block; toggling scrawl off never drops or shifts children", () => {
		const { getByTestId: getOn } = renderFrame("offer-letter", {
			params: { scrawl: true },
		});
		expect(getOn("body").textContent).toBe(BODY_TEXT);
		cleanup();
		const { getByTestId: getOff } = renderFrame("offer-letter", {
			params: { scrawl: false },
		});
		expect(getOff("body").textContent).toBe(BODY_TEXT);
	});
});

describe("J-extra - stock-driven custom properties (blocker 2 regression)", () => {
	it("timecard sets --tc-paper/--tc-ink inline, and they change with the stock knob", () => {
		const { container: manila } = renderFrame("timecard", {
			params: { stock: "manila" },
		});
		const manilaRoot = manila.querySelector(
			'[style*="--tc-paper"]',
		) as HTMLElement | null;
		expect(manilaRoot).not.toBeNull();
		const manilaPaper = manilaRoot?.style.getPropertyValue("--tc-paper");
		expect(manilaPaper).toBeTruthy();
		cleanup();

		const { container: ledger } = renderFrame("timecard", {
			params: { stock: "ledger" },
		});
		const ledgerRoot = ledger.querySelector(
			'[style*="--tc-paper"]',
		) as HTMLElement | null;
		expect(ledgerRoot?.style.getPropertyValue("--tc-paper")).not.toBe(
			manilaPaper,
		);
	});

	it("offer-letter sets --ol-paper/--ol-ink inline, and they change with the stock knob", () => {
		const { container: cream } = renderFrame("offer-letter", {
			params: { stock: "cream" },
		});
		const creamRoot = cream.querySelector(
			'[style*="--ol-paper"]',
		) as HTMLElement | null;
		expect(creamRoot).not.toBeNull();
		const creamPaper = creamRoot?.style.getPropertyValue("--ol-paper");
		expect(creamPaper).toBeTruthy();
		cleanup();

		const { container: dove } = renderFrame("offer-letter", {
			params: { stock: "dove" },
		});
		const doveRoot = dove.querySelector(
			'[style*="--ol-paper"]',
		) as HTMLElement | null;
		expect(doveRoot?.style.getPropertyValue("--ol-paper")).not.toBe(creamPaper);
	});

	it("punch-card sets --pc-paper/--pc-ink inline, and the paper-colored gaps follow salmon/mint - never stay manila (load-bearing)", () => {
		const { container: manila } = renderFrame("punch-card", {
			params: { stock: "manila" },
		});
		const manilaRoot = manila.querySelector(
			'[style*="--pc-paper"]',
		) as HTMLElement | null;
		expect(manilaRoot).not.toBeNull();
		const manilaPaper = manilaRoot?.style.getPropertyValue("--pc-paper");
		expect(manilaPaper).toBeTruthy();
		cleanup();

		const { container: salmon } = renderFrame("punch-card", {
			params: { stock: "salmon" },
		});
		const salmonRoot = salmon.querySelector(
			'[style*="--pc-paper"]',
		) as HTMLElement | null;
		expect(salmonRoot?.style.getPropertyValue("--pc-paper")).not.toBe(
			manilaPaper,
		);
		cleanup();

		const { container: mint } = renderFrame("punch-card", {
			params: { stock: "mint" },
		});
		const mintRoot = mint.querySelector(
			'[style*="--pc-paper"]',
		) as HTMLElement | null;
		expect(mintRoot?.style.getPropertyValue("--pc-paper")).not.toBe(
			manilaPaper,
		);
	});
});

describe("K2 - identity-lock regression guard: career is locked to nameplate, no other topic defaults to an ephemera frame", () => {
	it("TC-H1: career's IDENTITIES row deep-equals the exact nameplate lock", () => {
		expect(IDENTITIES.career.inner).toEqual({
			id: "nameplate",
			params: { density: "roomy", screws: false, role: "title" },
		});
	});

	it.each(
		TOPICS.filter((t) => t.id !== "career").map((t) => [t.id, t] as const),
	)("TC-H2/TC-H3: %s's IDENTITIES.inner.id is NOT one of the four ephemera ids", (_id, t) => {
		expect(EPHEMERA_IDS).not.toContain(IDENTITIES[t.id].inner.id);
	});
});
