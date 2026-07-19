import { useMatches, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef } from "react";
import type { CelestialState } from "../../data/celestial";
import { PERSONAL, PERSONAL_BY_SLUG } from "../../data/personal";
import { PROJECTS, type Project } from "../../data/projects";
import {
	PANEL_OPEN_CLASS,
	PANEL_SIDES,
	type PanelKey,
} from "../../data/sections";
import { STORIES, type StorySlug } from "../../data/stories";
import type { PersonalSlug } from "../../data/topics";
import { CAREER_PANEL_TITLE_ID, CareerPanel } from "../CareerPanel";
import { EarlyDaysPanel, getStoryPanelTitleId } from "../EarlyDaysPanel";
import { getProjectPanelTitleId, ProjectPanel } from "../ProjectPanel";
import { SKY_PANEL_TITLE_ID, SkyTuningPanel } from "../SkyTuningPanel";
import { getPersonalPanelTitleId, PersonalPanel } from "./PersonalPanel";

// Derived from PERSONAL so it can never drift from the source of truth.
const PERSONAL_ROUTE_TO_SLUG: Record<string, PersonalSlug> = Object.fromEntries(
	PERSONAL.map((p) => [`/_layout/${p.slug}`, p.slug]),
) as Record<string, PersonalSlug>;

// Same shape for stories.
const STORY_ROUTE_TO_SLUG: Record<string, StorySlug> = Object.fromEntries(
	STORIES.map((s) => [`/_layout/${s.slug}`, s.slug]),
) as Record<string, StorySlug>;

function deriveUrlPanel(
	matches: ReturnType<typeof useMatches>,
): PanelKey | null {
	for (const m of matches) {
		if (m.routeId === "/_layout/career") return "career";
		if (m.routeId === "/_layout/projects/$slug") {
			const slug = (m.params as { slug?: string }).slug;
			if (slug && PROJECTS.some((p) => p.slug === slug)) {
				return slug as Project["slug"];
			}
			return null;
		}
		const personalSlug = PERSONAL_ROUTE_TO_SLUG[m.routeId];
		if (personalSlug) return personalSlug;
		const storySlug = STORY_ROUTE_TO_SLUG[m.routeId];
		if (storySlug) return storySlug;
	}
	return null;
}

type PanelHostProps = {
	skyOpen: boolean;
	setSkyOpen: (v: boolean) => void;
	celestial: CelestialState;
	setCelestial: (s: CelestialState) => void;
	lastTriggerRef: React.RefObject<HTMLElement | null>;
	onPanelChange?: (info: {
		key: PanelKey | null;
		side: "left" | "right" | null;
		rect: DOMRect | null;
	}) => void;
	navRef?: React.RefObject<HTMLElement | null>;
	mainShellRef?: React.RefObject<HTMLDivElement | null>;
};

const FOCUSABLE_SELECTOR =
	'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export function PanelHost({
	skyOpen,
	setSkyOpen,
	celestial,
	setCelestial,
	lastTriggerRef,
	onPanelChange,
	navRef,
	mainShellRef,
}: PanelHostProps) {
	const matches = useMatches();
	const navigate = useNavigate();
	const urlPanel = deriveUrlPanel(matches);
	// sky popover takes precedence over URL panel; closing sky reveals the URL panel underneath
	const openPanel: PanelKey | null = skyOpen ? "sky" : urlPanel;

	const skyRef = useRef<HTMLDialogElement>(null);
	const careerRef = useRef<HTMLDialogElement>(null);
	const earlyDaysRef = useRef<HTMLDialogElement>(null);
	const goodwatchRef = useRef<HTMLDialogElement>(null);
	const aistackRef = useRef<HTMLDialogElement>(null);
	const alpriverRef = useRef<HTMLDialogElement>(null);
	const manaschmiedeRef = useRef<HTMLDialogElement>(null);
	const musicRef = useRef<HTMLDialogElement>(null);
	const moviesRef = useRef<HTMLDialogElement>(null);
	const travelRef = useRef<HTMLDialogElement>(null);
	// Tracks the URL-driven panel for the close-event handler to distinguish
	// user-initiated closes (ESC/backdrop) from URL-driven panel transitions.
	const urlPanelRef = useRef<PanelKey | null>(null);

	const panelRefs: Record<
		PanelKey,
		React.RefObject<HTMLDialogElement | null>
	> = useMemo(
		() => ({
			sky: skyRef,
			career: careerRef,
			"early-days": earlyDaysRef,
			goodwatch: goodwatchRef,
			aistack: aistackRef,
			alpriver: alpriverRef,
			manaschmiede: manaschmiedeRef,
			music: musicRef,
			movies: moviesRef,
			travel: travelRef,
		}),
		[],
	);

	useEffect(() => {
		urlPanelRef.current = urlPanel;
	}, [urlPanel]);

	// Click-out: the .panel-surface is a transparent full-viewport scroller, so a
	// click landing on the scroller itself (the empty landscape around the frosted
	// column, not the column content) dismisses - re-providing the click-outside
	// the non-modal dialog lost with the UA backdrop.
	const onSurfaceClick = (e: React.MouseEvent<HTMLDialogElement>) => {
		if (e.target === e.currentTarget) e.currentTarget.close();
	};

	useEffect(() => {
		(Object.keys(panelRefs) as PanelKey[]).forEach((key) => {
			const dialog = panelRefs[key].current;
			if (!dialog) return;
			if (openPanel === key && !dialog.open) {
				// The dev sky panel stays modal (it's a tool overlay). The detail
				// panels open NON-modally so they composite in normal flow in the
				// same stacking context as the -z-10 dived scene - a modal dialog
				// would paint in the browser top layer above the landscape and the
				// frosted surface would reveal the UA backdrop, not the dived world.
				if (key === "sky") {
					dialog.showModal();
				} else {
					dialog.show();
				}
			} else if (openPanel !== key && dialog.open) {
				dialog.close();
			}
		});
		document.body.classList.toggle(PANEL_OPEN_CLASS, openPanel !== null);
	}, [openPanel, panelRefs]);

	// Inert the nav and main-shell while a detail panel is open (non-modal) so
	// background content is removed from both tab order and AT virtual-cursor.
	// Sky panel stays modal (showModal provides its own inertness) - skip it.
	useEffect(() => {
		const isDetailOpen = openPanel !== null && openPanel !== "sky";
		if (navRef?.current) navRef.current.inert = isDetailOpen;
		if (mainShellRef?.current) mainShellRef.current.inert = isDetailOpen;
		return () => {
			if (navRef?.current) navRef.current.inert = false;
			if (mainShellRef?.current) mainShellRef.current.inert = false;
		};
	}, [openPanel, navRef, mainShellRef]);

	// Drive the dive from _layout: report the open detail panel (and its trigger
	// rect) on every open/close so the parent can aim and fire the zoom.
	useEffect(() => {
		if (!onPanelChange) return;
		const detailKey = openPanel && openPanel !== "sky" ? openPanel : null;
		onPanelChange({
			key: detailKey,
			side: detailKey ? PANEL_SIDES[detailKey] : null,
			rect: lastTriggerRef.current?.getBoundingClientRect() ?? null,
		});
	}, [openPanel, onPanelChange, lastTriggerRef]);

	// Non-modal panels lose the UA-provided Esc-to-close and focus trap; re-provide
	// both while a detail panel is open. Focus restore on close lives in the
	// per-dialog close handler below (kept from the modal era).
	useEffect(() => {
		if (!openPanel || openPanel === "sky") return;
		const dialog = panelRefs[openPanel].current;
		if (!dialog) return;

		// Move focus into the panel on open (first focusable, else the panel itself).
		const focusables = () =>
			Array.from(
				dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
			).filter(
				(el) => el.offsetParent !== null || el === document.activeElement,
			);
		const first = focusables()[0];
		if (first) {
			first.focus();
		} else {
			dialog.focus();
		}

		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				e.preventDefault();
				dialog.close();
				return;
			}
			if (e.key !== "Tab") return;
			const items = focusables();
			const firstItem = items[0];
			const lastItem = items[items.length - 1];
			if (!firstItem || !lastItem) {
				e.preventDefault();
				return;
			}
			const active = document.activeElement;
			if (e.shiftKey) {
				if (active === firstItem || !dialog.contains(active)) {
					e.preventDefault();
					lastItem.focus();
				}
			} else if (active === lastItem || !dialog.contains(active)) {
				e.preventDefault();
				firstItem.focus();
			}
		};
		document.addEventListener("keydown", onKeyDown);
		return () => document.removeEventListener("keydown", onKeyDown);
	}, [openPanel, panelRefs]);

	// Subtle scroll-parallax: while a detail panel is open, wire the panel-surface
	// scroller's scrollTop to a CSS var on :root that the .dive-scene reads for a
	// gentle drift (see .dive-scene `translate` in styles.css). It does NOT feed
	// scrollProgress, so the sky/time-of-day stays frozen - only the held scene
	// drifts. Reduced-motion is honored in CSS (translate pinned to none), so the
	// var write is inert there; we still reset to 0 on close.
	useEffect(() => {
		const root = document.documentElement;
		if (!openPanel || openPanel === "sky") {
			root.style.setProperty("--subpage-scroll", "0");
			return;
		}
		const dialog = panelRefs[openPanel].current;
		if (!dialog) return;
		const onScroll = () => {
			root.style.setProperty("--subpage-scroll", String(dialog.scrollTop));
		};
		onScroll();
		dialog.addEventListener("scroll", onScroll, { passive: true });
		return () => {
			dialog.removeEventListener("scroll", onScroll);
			root.style.setProperty("--subpage-scroll", "0");
		};
	}, [openPanel, panelRefs]);

	useEffect(() => {
		const cleanups: Array<() => void> = [];
		(Object.keys(panelRefs) as PanelKey[]).forEach((key) => {
			const dialog = panelRefs[key].current;
			if (!dialog) return;
			const onClose = () => {
				if (key === "sky") {
					setSkyOpen(false);
				} else if (
					urlPanelRef.current === key &&
					window.location.pathname !== "/"
				) {
					// URL still says THIS panel should be open, so the close came from
					// user action (ESC/backdrop) - navigate home. If urlPanelRef has
					// moved to another panel (or null), the close was URL-driven and we
					// must not clobber the incoming URL.
					navigate({ to: "/", resetScroll: false });
				}
				const trigger = lastTriggerRef.current;
				if (
					trigger &&
					typeof trigger.focus === "function" &&
					document.body.contains(trigger)
				) {
					trigger.focus();
				}
			};
			dialog.addEventListener("close", onClose);
			cleanups.push(() => {
				dialog.removeEventListener("close", onClose);
			});
		});
		return () => {
			for (const fn of cleanups) fn();
			document.body.classList.remove(PANEL_OPEN_CLASS);
		};
	}, [navigate, panelRefs, lastTriggerRef, setSkyOpen]);

	return (
		<>
			<dialog
				ref={skyRef}
				aria-labelledby={SKY_PANEL_TITLE_ID}
				className="panel-dialog-modal"
				style={
					{
						"--panel-bg": "#ffffff",
						"--panel-fg": "#0f172a",
					} as React.CSSProperties
				}
			>
				<SkyTuningPanel
					state={celestial}
					onChange={setCelestial}
					onClose={() => setSkyOpen(false)}
				/>
			</dialog>

			{/* biome-ignore lint/a11y/useKeyWithClickEvents: keyboard dismissal (Esc) is provided by the document keydown trap; this onClick only adds mouse click-out on the empty scroller. */}
			<dialog
				ref={careerRef}
				aria-labelledby={CAREER_PANEL_TITLE_ID}
				className="panel-surface"
				onClick={onSurfaceClick}
				style={
					{
						"--panel-bg": "#1e293b",
						"--panel-fg": "#f8fafc",
					} as React.CSSProperties
				}
			>
				<CareerPanel onClose={() => careerRef.current?.close()} />
			</dialog>

			{STORIES.map((story) => (
				// biome-ignore lint/a11y/useKeyWithClickEvents: keyboard dismissal (Esc) is provided by the document keydown trap; this onClick only adds mouse click-out on the empty scroller.
				<dialog
					key={story.slug}
					ref={panelRefs[story.slug]}
					aria-labelledby={getStoryPanelTitleId(story.slug)}
					className="panel-surface"
					onClick={onSurfaceClick}
					style={
						{
							"--panel-bg": story.panelBg,
							"--panel-fg": story.panelFg,
						} as React.CSSProperties
					}
				>
					<EarlyDaysPanel
						story={story}
						onClose={() => panelRefs[story.slug].current?.close()}
					/>
				</dialog>
			))}

			{PROJECTS.map((p) => (
				// biome-ignore lint/a11y/useKeyWithClickEvents: keyboard dismissal (Esc) is provided by the document keydown trap; this onClick only adds mouse click-out on the empty scroller.
				<dialog
					key={p.slug}
					ref={panelRefs[p.slug]}
					aria-labelledby={getProjectPanelTitleId(p.slug)}
					className="panel-surface"
					onClick={onSurfaceClick}
					style={
						{
							"--panel-bg": p.panelColor,
							"--panel-fg": "#fff",
						} as React.CSSProperties
					}
				>
					<ProjectPanel
						project={p}
						open={openPanel === p.slug}
						onClose={() => panelRefs[p.slug].current?.close()}
					/>
				</dialog>
			))}

			{(
				Object.values(PERSONAL_BY_SLUG) as Array<
					(typeof PERSONAL_BY_SLUG)[PersonalSlug]
				>
			).map((item) => (
				// biome-ignore lint/a11y/useKeyWithClickEvents: keyboard dismissal (Esc) is provided by the document keydown trap; this onClick only adds mouse click-out on the empty scroller.
				<dialog
					key={item.slug}
					ref={panelRefs[item.slug]}
					aria-labelledby={getPersonalPanelTitleId(item.slug)}
					className="panel-surface"
					onClick={onSurfaceClick}
					style={
						{
							"--panel-bg": item.panelBg,
							"--panel-fg": item.panelFg,
						} as React.CSSProperties
					}
				>
					<PersonalPanel
						item={item}
						open={openPanel === item.slug}
						onClose={() => panelRefs[item.slug].current?.close()}
					/>
				</dialog>
			))}
		</>
	);
}
