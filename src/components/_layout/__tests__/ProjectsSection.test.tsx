// @vitest-environment jsdom

/*
 * ProjectsSection acceptance tests (wayfinder #47).
 *
 * PROJECTS is partially mocked (importOriginal + append) so a
 * `status: "building"` fixture project always exists in the rendered set,
 * regardless of what the real data file currently holds (today all four
 * flagships are "shipped"). This closes the vacuous-filter trap named at the
 * challenge gate (C1): PS-03b looks the building project up by `status`, not
 * by a hardcoded slug/title, so the assertion stays honest even if the real
 * data later grows its own "building" entries.
 *
 * The synthetic fixture is derived INSIDE the vi.mock factory by spreading
 * the real shipped, non-highlight comparator project (`PROJECTS.find(p =>
 * !p.highlight && p.status === "shipped")`) and overriding only
 * title/link/desc/status/slug - every other shape-bearing field (tags,
 * iconKey, panelColor, ...) is identical to that same comparator, so PS-03b
 * compares two cards whose only real difference is `status`. The slug is
 * overridden to a value outside the real slug union ("vaporware", cast via
 * `Project["slug"]`) so the fixture never collides with a real entry's React
 * key.
 *
 * The navigate spy mirrors TriggerCard.test.tsx's hoisted-spy idiom (a
 * stable mock, not `() => vi.fn()`, so exact call args are inspectable).
 *
 * C2/C3 (challenge-gate corrections) get dedicated cases: PS-08 pins that
 * neither the card button nor the escape-hatch anchor suppresses the focus
 * outline (Tailwind v4's `outline-hidden`, the prototype's now-stale
 * `outline-none`, or any future spelling) without also carrying an explicit
 * `focus-visible:` outline/ring replacement; PS-09 pins the button's own
 * full-span layout classes so its rect can't collapse to zero (the dive aims
 * at this button's rect).
 */

import {
	cleanup,
	fireEvent,
	render,
	screen,
	within,
} from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Project } from "../../../data/projects";

const navigate = vi.hoisted(() => vi.fn());
vi.mock("@tanstack/react-router", () => ({ useNavigate: () => navigate }));

// Controls the section's frozen day/night phase (PS-13). jsdom has no real
// scroll geometry (`useSectionNightPhase` always measures day there), so the
// hook is stubbed with a settable value; everything else in SectionTitle
// stays real. Default false = day, matching the unmocked jsdom behavior for
// every other case.
const nightPhase = vi.hoisted(() => ({ value: false }));
vi.mock("../SectionTitle", async (importOriginal) => {
	const actual = await importOriginal<typeof import("../SectionTitle")>();
	return {
		...actual,
		useSectionNightPhase: () => nightPhase.value,
	};
});

// A synthetic "building" fixture, appended to the real PROJECTS so C1 never
// tests over an empty set. Derived by spreading the real shipped,
// non-highlight comparator project so every shape-bearing field (tags,
// iconKey, panelColor, panelLight, media, ...) matches it exactly - only
// title/link/desc/status/slug are overridden, making `status` the sole
// structurally-meaningful difference for PS-03b's comparison. `slug` is
// pushed outside the real slug union (Project["slug"] now spans all eight
// real projects - the four flagships plus curia, claude-statusline,
// alperortac-com, and alfredo - and "vaporware" still sits outside that
// union) so it can never collide with a real entry's React key.
vi.mock("../../../data/projects", async (importOriginal) => {
	const actual =
		await importOriginal<typeof import("../../../data/projects")>();
	const comparator = actual.PROJECTS.find(
		(p) => !p.highlight && p.status === "shipped",
	);
	if (!comparator) {
		throw new Error(
			"fixture derivation requires a shipped, non-highlight project in PROJECTS",
		);
	}
	const syntheticBuilding: Project = {
		...comparator,
		slug: "vaporware" as Project["slug"],
		title: "Vaporware",
		desc: "Structural chrome parity fixture for the PS-03 test double, not a real product.",
		link: "https://example.com/vaporware",
		status: "building",
	};
	return {
		...actual,
		PROJECTS: [...actual.PROJECTS, syntheticBuilding],
	};
});

import { PROJECTS } from "../../../data/projects";
import { ProjectsSection } from "../ProjectsSection";

function renderSection() {
	const ref = createRef<HTMLElement | null>();
	const utils = render(<ProjectsSection lastTriggerRef={ref} />);
	return { ...utils, ref };
}

// Card titles are <span>s, not headings: a <button>'s content model is
// phrasing content, so a real <h3> inside the card button would be invalid
// HTML. #52 accepted that rather than restructuring, because heading
// navigation is a SKIP mechanism and adjacent single-control cards have
// nothing to skip - the `B` (next button) route reaches the same targets.
// What #52 fixed instead is that route's accessible names; see PS-19/PS-20.
// This helper resolves the button THROUGH the title node, so it also pins
// that the visible title stays inside the button.
function cardButton(title: string): HTMLButtonElement {
	const titleEl = screen.getByText(title);
	const button = titleEl.closest("button");
	if (!button) throw new Error(`No ancestor button for card titled "${title}"`);
	return button as HTMLButtonElement;
}

// The card ROOT is the button's parent (the wrapper div carrying all the
// chrome per the plan's structural correction) - not the button itself,
// which the plan deliberately strips down to layout-only classes.
function cardRoot(title: string): HTMLElement {
	const button = cardButton(title);
	const root = button.parentElement;
	if (!root) throw new Error(`No parent element for card titled "${title}"`);
	return root;
}

// Ordered tagName+className of every descendant, so an added badge node, a
// status-conditional class anywhere in the card, or a status-conditional
// attribute all show up as a diff even though the two cards' text content
// legitimately differs (title/desc/host pill).
function domSkeleton(root: HTMLElement): string[] {
	return Array.from(root.querySelectorAll("*")).map(
		(el) => `${el.tagName}.${el.className}`,
	);
}

function escapeHatch(title: string): HTMLElement {
	return screen.getByRole("link", {
		name: `Visit ${title} (opens in new tab)`,
	});
}

describe("ProjectsSection", () => {
	afterEach(() => {
		cleanup();
		navigate.mockClear();
		nightPhase.value = false;
	});

	it("PS-01 renders one card per PROJECTS entry inside section#projects", () => {
		const { container } = renderSection();
		const section = container.querySelector("section#projects");
		expect(section).not.toBeNull();
		for (const project of PROJECTS) {
			expect(
				within(section as HTMLElement).getByText(project.title),
			).toBeTruthy();
		}
	});

	it("PS-02 tiers cards by PROJECTS[].highlight into the featured vs regular grid", () => {
		renderSection();
		const featured = screen.getByTestId("projects-featured");
		const regular = screen.getByTestId("projects-regular");
		for (const project of PROJECTS) {
			const grid = project.highlight ? featured : regular;
			expect(within(grid).getByText(project.title)).toBeTruthy();
		}
	});

	// Scoped to the two card grids (not the whole section) so the section's
	// own locked tagline - "...everything I'm building now" - can't satisfy
	// a broad substring match. Testing Library's regex matcher runs a
	// substring test over each node's direct text, so an unscoped
	// `/\bbuilding\b/i` collides with that header copy and would go RED
	// against a correct implementation.
	it("PS-03a no 'Highlight' label and no status badge text anywhere in the card grids", () => {
		renderSection();
		const featured = screen.getByTestId("projects-featured");
		const regular = screen.getByTestId("projects-regular");
		for (const regex of [/highlight/i, /\bbuilding\b/i, /\bshipped\b/i]) {
			expect(within(featured).queryByText(regex)).toBeNull();
			expect(within(regular).queryByText(regex)).toBeNull();
		}
	});

	// C1: looked up by `status`, not by a hardcoded slug/title - stays honest
	// even if PROJECTS itself later grows a real "building" entry. Compares
	// card ROOTS (not the buttons, which the plan strips to layout-only
	// classes) via root className plus the full descendant tagName+className
	// skeleton, so an added badge node or any status-conditional class/attr
	// anywhere in the card would fail this.
	// B2 (challenge-gate correction): adding Curia (`status: "building"`) to
	// the real data means `PROJECTS.find(p => p.status === "building")` would
	// resolve to Curia first (real entries precede the appended `vaporware`
	// fixture) and compare Curia's card against Forge's - red against a
	// correct implementation, since the lucide icon carries per-icon classes
	// (lucide-landmark vs lucide-code-2). Fix: find `shippedRegular` FIRST with
	// the same comparator predicate the mock factory itself uses, then
	// restrict the building lookup to the SAME iconKey - this deterministically
	// re-selects the synthetic fixture (it spreads that same comparator) with
	// no hardcoded slug, so the test and the fixture can never structurally
	// diverge. The domSkeleton comparison itself stays untouched - it is
	// load-bearing (it is what catches a status-derived badge).
	it("PS-03b a status:'building' card renders the identical chrome as a shipped same-tier card (C1)", () => {
		renderSection();
		const shippedRegular = PROJECTS.find(
			(p) => !p.highlight && p.status === "shipped",
		);
		if (!shippedRegular) {
			throw new Error("fixture must include a shipped, non-highlight project");
		}
		const buildingProject = PROJECTS.find(
			(p) => p.status === "building" && p.iconKey === shippedRegular.iconKey,
		);
		if (!buildingProject) {
			throw new Error(
				"fixture must include a status:'building' project with the same iconKey as the shipped comparator (C1) - the mocked PROJECTS module dropped it",
			);
		}
		const buildingRoot = cardRoot(buildingProject.title);
		const shippedRoot = cardRoot(shippedRegular.title);
		expect(buildingRoot.className).toBe(shippedRoot.className);
		expect(domSkeleton(buildingRoot)).toEqual(domSkeleton(shippedRoot));
	});

	it("PS-04 escape hatch has correct accessible name, href, target, and rel for every project", () => {
		renderSection();
		for (const project of PROJECTS) {
			const link = escapeHatch(project.title);
			expect(link.getAttribute("href")).toBe(project.link);
			expect(link.getAttribute("target")).toBe("_blank");
			expect(link.getAttribute("rel")).toBe("noopener noreferrer");
		}
	});

	it("PS-05 clicking an escape hatch never calls navigate", () => {
		renderSection();
		const project = PROJECTS[0] as Project;
		const link = escapeHatch(project.title);
		fireEvent.click(link);
		expect(navigate).not.toHaveBeenCalled();
	});

	it("PS-06 clicking a card button dives via the Craft-verbatim navigate call and sets lastTriggerRef", () => {
		const { ref } = renderSection();
		const project = PROJECTS[0] as Project;
		const button = cardButton(project.title);
		expect(ref.current).toBeNull();
		fireEvent.click(button);
		expect(navigate).toHaveBeenCalledTimes(1);
		expect(navigate).toHaveBeenCalledWith({
			to: "/projects/$slug",
			params: { slug: project.slug },
			resetScroll: false,
		});
		expect(ref.current).toBe(button);
	});

	it("PS-07 every card shows the 'View details' dive label", () => {
		renderSection();
		expect(screen.getAllByText("View details").length).toBe(PROJECTS.length);
	});

	// C2: neither `outline-none` (the prototype's stale spelling) nor
	// Tailwind v4's actual focus-ring suppressor `outline-hidden` may be
	// ported unreplaced - the whole card is the primary control, so losing
	// its focus indicator would leave keyboard users with no visible focus.
	// The positive half: an element MAY suppress the default outline only if
	// it also carries an explicit `focus-visible:` outline/ring replacement.
	// Checked on BOTH tiers (one highlight + one regular project), not just
	// PROJECTS[0]: the tier split runs through the same component, but a
	// tier-conditional suppression on the branch PROJECTS[0] doesn't exercise
	// would otherwise stay green (the pass-4 acceptance hole).
	it("PS-08 neither the card button nor the escape-hatch anchor suppresses the focus outline without a focus-visible replacement, on both tiers (C2)", () => {
		renderSection();
		const featured = PROJECTS.find((p) => p.highlight);
		const regular = PROJECTS.find((p) => !p.highlight);
		if (!featured || !regular) {
			throw new Error("PROJECTS must contain a highlight and a regular entry");
		}
		for (const project of [featured, regular]) {
			const button = cardButton(project.title);
			const link = escapeHatch(project.title);
			for (const el of [button, link]) {
				const suppressesOutline = /outline-(none|hidden)/.test(el.className);
				const hasFocusVisibleReplacement = /focus-visible:(outline|ring)/.test(
					el.className,
				);
				expect(
					suppressesOutline && !hasFocusVisibleReplacement,
					`${project.title} (highlight=${String(project.highlight)}): ${el.tagName} suppresses the focus outline with no focus-visible replacement (className: "${el.className}")`,
				).toBe(false);
			}
		}
	});

	// C3: chrome (border/bg/shadow/hover/ring/group) moved onto the wrapper
	// div, but the BUTTON's own rect is what the dive aims at - it must still
	// explicitly span the card via its own layout classes.
	it("PS-09 the card button carries explicit full-span layout classes so its rect isn't collapsed (C3)", () => {
		renderSection();
		const project = PROJECTS[0] as Project;
		const button = cardButton(project.title);
		for (const cls of ["h-full", "w-full", "flex", "flex-col", "text-left"]) {
			expect(button.classList.contains(cls), `missing "${cls}"`).toBe(true);
		}
	});

	// The locked header copy (ticket #45): eyebrow, SectionTitle heading, and
	// tagline must all render inside section#projects - deleting or rewording
	// the header may not stay green.
	it("PS-10 renders the locked eyebrow, 'Projects' heading, and tagline inside section#projects", () => {
		const { container } = renderSection();
		const section = container.querySelector("section#projects");
		expect(section).not.toBeNull();
		const header = within(section as HTMLElement);
		expect(header.getByText("Selected work")).toBeTruthy();
		expect(header.getByRole("heading", { name: "Projects" })).toBeTruthy();
	});

	// Ticket #51 (manual walk of the shipped band). The eyebrow used to paint
	// the raw identity accent #b4531f with no phase branch. Measured off real
	// pixels in the running app that is 2.87:1 on the band's daylight sky -
	// under the 4.5:1 the 12px/900 eyebrow needs. C4 predicted the failure at
	// NIGHT; the band sits at progress ~0.17 and NIGHT_UI_THRESHOLD is 0.55, so
	// it never gets there and the failure is in the ONE phase it does occupy.
	// Pins both that the eyebrow tracks the phase and that neither tone is the
	// raw accent - reverting either half goes red.
	it("PS-16 the eyebrow paints the contrast-safe accent for its phase, never the raw decorative accent (#51/C4)", () => {
		const RAW_ACCENT = "rgb(180, 83, 31)"; // #b4531f, decorative-only
		const DAY = "rgb(122, 56, 21)"; // #7a3815
		const NIGHT = "rgb(204, 94, 35)"; // #cc5e23
		for (const night of [false, true]) {
			nightPhase.value = night;
			renderSection();
			const eyebrow = screen.getByText("Selected work");
			expect(eyebrow.style.color, `night=${night}`).toBe(night ? NIGHT : DAY);
			expect(
				eyebrow.style.color,
				`night=${night} fell back to raw accent`,
			).not.toBe(RAW_ACCENT);
			cleanup();
		}
	});

	// Ticket #51: the tag wash was text-slate-700/80, which composites to
	// 4.31:1 on the frosted card - a marginal miss of the 4.5:1 floor that
	// 10px/900 text needs. Dropping back to any /NN opacity re-breaks it.
	it("PS-17 tag chips carry full-opacity slate-700, not an opacity wash (#51)", () => {
		renderSection();
		const project = PROJECTS[0] as Project;
		const tag = screen.getByText(`#${project.tags[0]}`);
		expect(tag.classList.contains("text-slate-700")).toBe(true);
		for (const cls of Array.from(tag.classList)) {
			expect(cls, `tag re-introduced an opacity wash: "${cls}"`).not.toMatch(
				/^text-slate-\d+\/\d+$/,
			);
		}
	});

	// Ticket #51: the pill clears the 24px target floor at 28px, but the dive
	// button sits under it on every side with no buffer - measured on touch, a
	// 4px miss in any direction fired the dive instead of opening the link. The
	// ::after extends the hit area past the visible pill without resizing it.
	it("PS-18 every escape-hatch pill extends its hit area past the visible pill (#51)", () => {
		renderSection();
		for (const project of PROJECTS) {
			const hatch = escapeHatch(project.title);
			for (const cls of [
				"after:absolute",
				"after:-inset-2",
				"after:content-['']",
			]) {
				expect(
					hatch.classList.contains(cls),
					`${project.title} pill missing "${cls}"`,
				).toBe(true);
			}
		}
	});

	// The tier signal is derived INSIDE the component (`const big =
	// project.highlight`, no prop carries it), so only a rendered-output
	// assertion keeps it alive: without this case, `big` going constant or
	// inverting leaves every other case green while featured cards silently
	// lose ring-2/h-44/text-4xl - the locked "tier reads from SIZE alone"
	// rule breaking unnoticed (mutation-proven in the pass-2 review).
	it("PS-12 highlight tier reads from size alone: featured roots carry ring-2 and the tall media band, regular roots neither", () => {
		renderSection();
		const featured = PROJECTS.find((p) => p.highlight);
		const regular = PROJECTS.find((p) => !p.highlight);
		if (!featured || !regular) {
			throw new Error("PROJECTS must contain a highlight and a regular entry");
		}
		expect(cardRoot(featured.title).classList.contains("ring-2")).toBe(true);
		expect(cardRoot(regular.title).classList.contains("ring-2")).toBe(false);
		const bandOf = (title: string) =>
			cardButton(title).firstElementChild as HTMLElement;
		expect(bandOf(featured.title).classList.contains("h-44")).toBe(true);
		expect(bandOf(featured.title).classList.contains("h-28")).toBe(false);
		expect(bandOf(regular.title).classList.contains("h-28")).toBe(true);
		expect(bandOf(regular.title).classList.contains("h-44")).toBe(false);
	});

	// The pill's VISIBLE label is the stripped host of project.link (hostOf:
	// URL host minus a leading "www."), distinct from PS-04's accessible-name
	// check. Expected value derived per project, not hardcoded.
	it("PS-11 every escape-hatch pill's visible text is the stripped host of project.link", () => {
		renderSection();
		for (const project of PROJECTS) {
			const link = escapeHatch(project.title);
			const expectedHost = new URL(project.link).host.replace(/^www\./, "");
			expect(link.textContent).toBe(expectedHost);
		}
	});

	// The two-tone phase-adaptive focus indicator (C2, fix rounds 2-3). PS-08
	// only proves SOME focus-visible replacement exists - it is blind to WHICH,
	// so without this case the phase swap can collapse to a constant (the exact
	// round-1 defect: a dark-only indicator invisible against SKY_NIGHT) or
	// lose its contrasting companion band with a fully green suite
	// (mutation-proven in the pass-3 review). Pins, on BOTH controls, in BOTH
	// phases, and on BOTH tiers (one highlight + one regular project - a
	// featured-only or regular-only indicator left the suite green in the
	// pass-4 review): the phase-correct outline color, the phase-correct
	// contrasting ring color (the two-tone companion - one band light, one
	// dark, so one always clears 3:1 against the live sky), the opposite
	// phase's colors absent, and the geometry classes that make both bands
	// actually paint.
	it("PS-13 the focus indicator is two-tone and phase-pinned on both controls of both tiers: day = dark outline + white ring, night = light outline + dark ring", () => {
		const geometry = [
			"focus-visible:outline-2",
			"focus-visible:outline-offset-2",
			"focus-visible:ring-2",
		];
		const dayTones = [
			"focus-visible:outline-slate-900",
			"focus-visible:ring-white",
		];
		const nightTones = [
			"focus-visible:outline-slate-50",
			"focus-visible:ring-slate-900",
		];
		const featured = PROJECTS.find((p) => p.highlight);
		const regular = PROJECTS.find((p) => !p.highlight);
		if (!featured || !regular) {
			throw new Error("PROJECTS must contain a highlight and a regular entry");
		}
		for (const night of [false, true]) {
			nightPhase.value = night;
			renderSection();
			const expected = [...geometry, ...(night ? nightTones : dayTones)];
			const absent = night ? dayTones : nightTones;
			for (const project of [featured, regular]) {
				for (const el of [
					cardButton(project.title),
					escapeHatch(project.title),
				]) {
					for (const cls of expected) {
						expect(
							el.classList.contains(cls),
							`night=${night}, highlight=${String(project.highlight)}: ${el.tagName} missing "${cls}"`,
						).toBe(true);
					}
					for (const cls of absent) {
						expect(
							el.classList.contains(cls),
							`night=${night}, highlight=${String(project.highlight)}: ${el.tagName} carries wrong-phase "${cls}"`,
						).toBe(false);
					}
				}
			}
			cleanup();
		}
	});

	// PS-15 (ticket #47 follow-up, B2-respecced): the module mock appends the
	// `vaporware` fixture to the regular tier, so SEVEN regular cards render
	// inside this file (6 real + the fixture), not six. The real-data 2+6
	// shape is pinned separately, with the fixture filtered out by slug (no
	// hardcoded count assumption about which real projects exist beyond that
	// filter).
	//
	// The regular count moved 5 -> 6 with Alfredo, the eighth project (#76).
	// This case is the band-layout half of that decision's guard - see AGENTS.md
	// for why 2 + 6 is the shape the two grids want.
	it("PS-15 featured is exactly the 2 highlights; regular is exactly the non-highlight set (7 in-file, 6 real)", () => {
		renderSection();
		const featured = screen.getByTestId("projects-featured");
		const regular = screen.getByTestId("projects-regular");

		const highlightTitles = PROJECTS.filter((p) => p.highlight).map(
			(p) => p.title,
		);
		expect(highlightTitles).toEqual(["GoodWatch", "AIStack"]);
		for (const title of highlightTitles) {
			expect(within(featured).getByText(title)).toBeTruthy();
		}

		const regularProjects = PROJECTS.filter((p) => !p.highlight);
		expect(regularProjects.length).toBe(7);
		for (const project of regularProjects) {
			expect(within(regular).getByText(project.title)).toBeTruthy();
		}

		// Real-data shape (fixture filtered out by slug): 2 featured + 5 regular.
		const realProjects = PROJECTS.filter(
			(p) => (p.slug as string) !== "vaporware",
		);
		const realHighlights = realProjects.filter((p) => p.highlight);
		const realRegulars = realProjects.filter((p) => !p.highlight);
		expect(realHighlights.length).toBe(2);
		expect(realRegulars.length).toBe(6);
		for (const title of [
			"Curia",
			"claude-statusline",
			"alperortac.com",
			"Alfredo",
		]) {
			expect(realRegulars.some((p) => p.title === title)).toBe(true);
		}
	});

	// #52: the band is held to "survey the 7 projects without linear reading",
	// and the route that has to carry that is the button list, since the cards
	// contribute no headings. Without aria-label the name computes from the
	// button's whole subtree - 102 characters of title + desc + tags + "View
	// details" per card, measured on the #52 prototype - which turns the button
	// list back into the linear read it was supposed to replace. `name` here is
	// the REAL computed accessible name (testing-library runs the full
	// algorithm), not the raw attribute, so this fails if the label is ever
	// dropped and the subtree starts naming the button again.
	it("PS-19 every card button's accessible name is exactly the project title, not its whole subtree (#52)", () => {
		renderSection();
		for (const project of PROJECTS) {
			const button = screen.getByRole("button", { name: project.title });
			expect(button.tagName).toBe("BUTTON");
			// The desc is the bulk of what the old subtree-derived name dragged
			// in; assert it is gone from the name rather than only that the name
			// matches, so a future label like `${title} ${desc}` still fails.
			expect(
				(button.getAttribute("aria-label") ?? "").includes(project.desc),
			).toBe(false);
		}
	});

	// The short name is for the button LIST; a keyboard+SR user tabbing to a
	// card would otherwise lose the description the long name used to carry by
	// accident. aria-describedby hands it back on focus. It points at the
	// card's own desc node (a descendant of the button, which is legal and
	// keeps the text single-sourced), so this pins the wiring, not a duplicate.
	it("PS-20 every card button describes itself with its own description node, so focus still announces the desc (#52)", () => {
		renderSection();
		for (const project of PROJECTS) {
			const button = cardButton(project.title);
			const id = button.getAttribute("aria-describedby");
			expect(
				id,
				`no aria-describedby on the "${project.title}" card`,
			).toBeTruthy();
			const desc = document.getElementById(id as string);
			expect(desc, `aria-describedby="${id}" resolves to nothing`).toBeTruthy();
			expect(desc?.textContent).toBe(project.desc);
			expect(button.contains(desc)).toBe(true);
		}
	});
});
