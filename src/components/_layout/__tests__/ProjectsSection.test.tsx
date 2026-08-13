// @vitest-environment jsdom

/*
 * ProjectsSection acceptance tests, rewritten for the 2026-08-09 band revamp
 * (three labeled groups; composition folded in from prototype variant B on
 * branch prototype/projects-band-revamp).
 *
 * PROJECTS is partially mocked (importOriginal + append) so a
 * `status: "building"` fixture project always exists in the rendered set.
 * The synthetic fixture is derived INSIDE the vi.mock factory by spreading
 * the real shipped, image-backed tools comparator (`PROJECTS.find(p =>
 * p.group === "tools" && p.status === "shipped" && p.cardShot)`) and
 * overriding only title/link/desc/status/slug - every other shape-bearing
 * field (group, tags, iconKey, cardShot, ...) is identical to that same
 * comparator, so PS-03b compares two cards whose only real difference is
 * `status`. The slug is overridden to a value outside the real slug union
 * ("vaporware", cast via `Project["slug"]`) so the fixture never collides
 * with a real entry's React key.
 *
 * The navigate spy mirrors TriggerCard.test.tsx's hoisted-spy idiom. The
 * frozen day/night phase hook is stubbed with a settable value (jsdom has no
 * real scroll geometry).
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

const nightPhase = vi.hoisted(() => ({ value: false }));
vi.mock("../SectionTitle", async (importOriginal) => {
	const actual = await importOriginal<typeof import("../SectionTitle")>();
	return {
		...actual,
		useSectionNightPhase: () => nightPhase.value,
	};
});

vi.mock("../../../data/projects", async (importOriginal) => {
	const actual =
		await importOriginal<typeof import("../../../data/projects")>();
	const comparator = actual.PROJECTS.find(
		(p) => p.group === "tools" && p.status === "shipped" && p.cardShot,
	);
	if (!comparator) {
		throw new Error(
			"fixture derivation requires a shipped, image-backed tools project in PROJECTS",
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
// phrasing content (#52's accepted trade, unchanged by the revamp). This
// helper resolves the button THROUGH the title node, so it also pins that
// the visible title stays inside the button on every card kind.
function cardButton(title: string): HTMLButtonElement {
	const titleEl = screen.getByText(title);
	const button = titleEl.closest("button");
	if (!button) throw new Error(`No ancestor button for card titled "${title}"`);
	return button as HTMLButtonElement;
}

// The card ROOT is the button's parent - the wrapper div carrying the chrome.
function cardRoot(title: string): HTMLElement {
	const button = cardButton(title);
	const root = button.parentElement;
	if (!root) throw new Error(`No parent element for card titled "${title}"`);
	return root;
}

// Ordered tagName+className of every descendant, so an added badge node or a
// status-conditional class anywhere in the card shows up as a diff.
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

// One representative per group, resolved from data (never hardcoded slugs).
function representatives() {
	const app = PROJECTS.find((p) => p.group === "apps");
	const tool = PROJECTS.find((p) => p.group === "tools");
	const personal = PROJECTS.find((p) => p.group === "personal");
	if (!app || !tool || !personal) {
		throw new Error("PROJECTS must contain all three groups");
	}
	return { app, tool, personal };
}

const GROUP_TESTIDS: Record<Project["group"], string> = {
	apps: "projects-apps",
	tools: "projects-tools",
	personal: "projects-personal",
};

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

	it("PS-02 places every card in its group's container, per PROJECTS[].group", () => {
		renderSection();
		for (const project of PROJECTS) {
			const grid = screen.getByTestId(GROUP_TESTIDS[project.group]);
			expect(
				within(grid).getByText(project.title),
				`${project.title} not in ${GROUP_TESTIDS[project.group]}`,
			).toBeTruthy();
		}
	});

	it("PS-21 renders the three group labels", () => {
		renderSection();
		for (const label of ["Live Apps", "AI Tools", "Personal"]) {
			expect(screen.getByText(label)).toBeTruthy();
		}
	});

	it("PS-03a no status badge text anywhere in the card containers", () => {
		renderSection();
		for (const testid of Object.values(GROUP_TESTIDS)) {
			const grid = screen.getByTestId(testid);
			for (const regex of [/\bbuilding\b/i, /\bshipped\b/i]) {
				expect(within(grid).queryByText(regex)).toBeNull();
			}
		}
	});

	// Looked up by `status`, not by a hardcoded slug/title. The comparator is
	// re-selected with the mock factory's own predicate, then the building
	// lookup is restricted to the same iconKey, deterministically re-finding
	// the synthetic fixture (which spreads that comparator) with no hardcoded
	// slug. The domSkeleton comparison is what catches a status-derived badge.
	it("PS-03b a status:'building' card renders the identical chrome as a shipped same-group card", () => {
		renderSection();
		const shippedTool = PROJECTS.find(
			(p) => p.group === "tools" && p.status === "shipped" && p.cardShot,
		);
		if (!shippedTool) {
			throw new Error("fixture must include a shipped, image-backed tool");
		}
		const buildingProject = PROJECTS.find(
			(p) => p.status === "building" && p.iconKey === shippedTool.iconKey,
		);
		if (!buildingProject) {
			throw new Error(
				"fixture must include a status:'building' project with the same iconKey as the shipped comparator - the mocked PROJECTS module dropped it",
			);
		}
		const buildingRoot = cardRoot(buildingProject.title);
		const shippedRoot = cardRoot(shippedTool.title);
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

	it("PS-06 clicking a card button dives via the navigate call and sets lastTriggerRef, on every card kind", () => {
		const { ref } = renderSection();
		const { app, tool, personal } = representatives();
		let calls = 0;
		for (const project of [app, tool, personal]) {
			const button = cardButton(project.title);
			fireEvent.click(button);
			calls += 1;
			expect(navigate).toHaveBeenCalledTimes(calls);
			expect(navigate).toHaveBeenLastCalledWith({
				to: "/projects/$slug",
				params: { slug: project.slug },
				resetScroll: false,
			});
			expect(ref.current).toBe(button);
		}
	});

	// Neither `outline-none` nor Tailwind v4's `outline-hidden` may appear
	// unreplaced - the whole card is the primary control. Checked on one
	// representative of each card kind.
	it("PS-08 no control suppresses the focus outline without a focus-visible replacement, on all card kinds", () => {
		renderSection();
		const { app, tool, personal } = representatives();
		for (const project of [app, tool, personal]) {
			const button = cardButton(project.title);
			const link = escapeHatch(project.title);
			for (const el of [button, link]) {
				const suppressesOutline = /outline-(none|hidden)/.test(el.className);
				const hasFocusVisibleReplacement = /focus-visible:(outline|ring)/.test(
					el.className,
				);
				expect(
					suppressesOutline && !hasFocusVisibleReplacement,
					`${project.title} (${project.group}): ${el.tagName} suppresses the focus outline with no focus-visible replacement (className: "${el.className}")`,
				).toBe(false);
			}
		}
	});

	// Chrome lives on the wrapper; the BUTTON's own rect is what the dive aims
	// at - it must still explicitly span the card via its own layout classes.
	it("PS-09 every card button carries explicit full-span layout classes so its rect isn't collapsed", () => {
		renderSection();
		const { app, tool, personal } = representatives();
		for (const project of [app, tool, personal]) {
			const button = cardButton(project.title);
			for (const cls of ["h-full", "w-full", "flex", "text-left"]) {
				expect(
					button.classList.contains(cls),
					`${project.title} (${project.group}): missing "${cls}"`,
				).toBe(true);
			}
		}
	});

	// Revamp: the header keeps the eyebrow and the heading, and DROPS the old
	// tagline - the group labels absorbed its job.
	it("PS-10 renders the eyebrow and 'Projects' heading, and no tagline, inside section#projects", () => {
		const { container } = renderSection();
		const section = container.querySelector("section#projects");
		expect(section).not.toBeNull();
		const header = within(section as HTMLElement);
		expect(header.getByText("Selected work")).toBeTruthy();
		expect(header.getByRole("heading", { name: "Projects" })).toBeTruthy();
		expect(header.queryByText(/Everything I('|&apos;)ve built/i)).toBeNull();
	});

	// Ticket #51: the eyebrow paints the contrast-safe accent for its phase,
	// never the raw decorative accent.
	it("PS-16 the eyebrow paints the contrast-safe accent for its phase (#51)", () => {
		const RAW_ACCENT = "rgb(180, 83, 31)"; // #b4531f, decorative-only
		const DAY = "rgb(122, 56, 21)"; // #7a3815
		const NIGHT = "rgb(204, 94, 35)"; // #cc5e23
		for (const night of [false, true]) {
			nightPhase.value = night;
			renderSection();
			for (const el of [
				screen.getByText("Selected work"),
				screen.getByText("Live Apps"),
			]) {
				expect(el.style.color, `night=${night}`).toBe(night ? NIGHT : DAY);
				expect(
					el.style.color,
					`night=${night} fell back to raw accent`,
				).not.toBe(RAW_ACCENT);
			}
			cleanup();
		}
	});

	// Ticket #51: tags (now on the apps rows only) stay full-opacity slate-700.
	it("PS-17 tag chips carry full-opacity slate-700, not an opacity wash (#51)", () => {
		renderSection();
		const { app } = representatives();
		const tag = screen.getByText(`#${app.tags[0]}`);
		expect(tag.classList.contains("text-slate-700")).toBe(true);
		for (const cls of Array.from(tag.classList)) {
			expect(cls, `tag re-introduced an opacity wash: "${cls}"`).not.toMatch(
				/^text-slate-\d+\/\d+$/,
			);
		}
	});

	// Ticket #51: the pill extends its hit area past the visible pill.
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

	it("PS-11 every escape-hatch pill's visible text is the stripped host of project.link", () => {
		renderSection();
		for (const project of PROJECTS) {
			const link = escapeHatch(project.title);
			const expectedHost = new URL(project.link).host.replace(/^www\./, "");
			expect(link.textContent).toBe(expectedHost);
		}
	});

	// The two-tone phase-adaptive focus indicator, on both controls of one
	// representative per card kind, in both phases.
	it("PS-13 the focus indicator is two-tone and phase-pinned on both controls of every card kind", () => {
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
		for (const night of [false, true]) {
			nightPhase.value = night;
			renderSection();
			const { app, tool, personal } = representatives();
			const expected = [...geometry, ...(night ? nightTones : dayTones)];
			const absent = night ? dayTones : nightTones;
			for (const project of [app, tool, personal]) {
				for (const el of [
					cardButton(project.title),
					escapeHatch(project.title),
				]) {
					for (const cls of expected) {
						expect(
							el.classList.contains(cls),
							`night=${night}, ${project.group}: ${el.tagName} missing "${cls}"`,
						).toBe(true);
					}
					for (const cls of absent) {
						expect(
							el.classList.contains(cls),
							`night=${night}, ${project.group}: ${el.tagName} carries wrong-phase "${cls}"`,
						).toBe(false);
					}
				}
			}
			cleanup();
		}
	});

	// The revamp's group shape: 2 apps, 4 real tools (+1 fixture in-file),
	// 2 personal. Group membership itself is pinned in the data tests; this is
	// the rendered-layout half.
	it("PS-15 each group container holds exactly its group's cards (tools carries the +1 fixture)", () => {
		renderSection();
		for (const [group, testid] of Object.entries(GROUP_TESTIDS)) {
			const grid = screen.getByTestId(testid);
			const expected = PROJECTS.filter((p) => p.group === group);
			for (const project of expected) {
				expect(within(grid).getByText(project.title)).toBeTruthy();
			}
			expect(within(grid).getAllByRole("button").length).toBe(expected.length);
		}
		const realTools = PROJECTS.filter(
			(p) => p.group === "tools" && (p.slug as string) !== "vaporware",
		);
		expect(realTools.length).toBe(4);
	});

	// #52: the button list is the survey mechanism; the accessible name must
	// stay the title alone, never the whole subtree.
	it("PS-19 every card button's accessible name is exactly the project title (#52)", () => {
		renderSection();
		for (const project of PROJECTS) {
			const button = screen.getByRole("button", { name: project.title });
			expect(button.tagName).toBe("BUTTON");
			expect(
				(button.getAttribute("aria-label") ?? "").includes(project.desc),
			).toBe(false);
		}
	});

	// #52: aria-describedby hands the description back on focus, pointing at
	// the card's own desc node inside the button.
	it("PS-20 every card button describes itself with its own description node (#52)", () => {
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

	// Revamp: the apps rows carry the proof line and the dormant screenshot.
	// The screenshot rests blurred + partly desaturated (55%, never full
	// monochrome) and declares the group-hover wake; both filter functions are
	// present in the resting classes so the wake can animate (mismatched
	// filter lists do not interpolate). The tools grid shares the same dormant
	// contract: its image cards filter the shot, Curia filters the live-art
	// layer.
	it("PS-22 apps rows render the proof line and the dormant, hover-waking screenshot", () => {
		renderSection();
		const grid = screen.getByTestId("projects-apps");
		const apps = PROJECTS.filter((p) => p.group === "apps");
		for (const project of apps) {
			expect(project.proof).toBeTruthy();
			expect(
				within(grid).getByText(project.proof as string),
				`${project.title} proof line missing`,
			).toBeTruthy();
		}
		const dormantClasses = [
			"grayscale-[55%]",
			"blur-[4px]",
			"group-hover:grayscale-0",
			"group-hover:blur-[0px]",
			"motion-reduce:transition-none",
		];
		const shots = Array.from(grid.querySelectorAll("img"));
		expect(shots.length).toBe(apps.length);
		for (const img of shots) {
			for (const cls of dormantClasses) {
				expect(img.classList.contains(cls), `screenshot missing "${cls}"`).toBe(
					true,
				);
			}
		}
		const toolsGrid = screen.getByTestId("projects-tools");
		const tools = PROJECTS.filter((p) => p.group === "tools");
		const toolVisuals = Array.from(
			toolsGrid.querySelectorAll(".grayscale-\\[55\\%\\]"),
		);
		expect(toolVisuals.length).toBe(tools.length);
		for (const visual of toolVisuals) {
			for (const cls of dormantClasses) {
				expect(
					visual.classList.contains(cls),
					`tool visual missing "${cls}"`,
				).toBe(true);
			}
		}
	});
});
