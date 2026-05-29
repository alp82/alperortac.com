import { useMatches, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef } from "react";
import type { CelestialState } from "../../data/celestial";
import { TRIGGERS_ENABLED } from "../../data/flags";
import { PERSONAL, PERSONAL_BY_SLUG } from "../../data/personal";
import { PROJECTS, type Project } from "../../data/projects";
import { PANEL_SIDES, type PanelKey } from "../../data/sections";
import { STORIES, type StorySlug } from "../../data/stories";
import { type PersonalSlug, TOPICS } from "../../data/topics";
import { CAREER_PANEL_TITLE_ID, CareerPanel } from "../CareerPanel";
import { EARLY_DAYS_PANEL_TITLE_ID, EarlyDaysPanel } from "../EarlyDaysPanel";
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

// Build a lookup from PersonalSlug → teaser using TOPICS.
// Personal-triggering topics always carry a teaser; the `?? ""` is a TS
// formality since Topic.teaser is optional for promoted topics (which never
// trigger personals).
const PERSONAL_TEASER: Record<string, string> = Object.fromEntries(
	TOPICS.flatMap((t) =>
		t.triggers
			.filter((tr) => tr.kind === "personal")
			.map((tr) => [tr.slug, t.teaser ?? ""]),
	),
);

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
};

export function PanelHost({
	skyOpen,
	setSkyOpen,
	celestial,
	setCelestial,
	lastTriggerRef,
}: PanelHostProps) {
	const matches = useMatches();
	const navigate = useNavigate();
	const urlPanel = TRIGGERS_ENABLED ? deriveUrlPanel(matches) : null;
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
		}),
		[],
	);

	useEffect(() => {
		urlPanelRef.current = urlPanel;
	}, [urlPanel]);

	useEffect(() => {
		(Object.keys(panelRefs) as PanelKey[]).forEach((key) => {
			const dialog = panelRefs[key].current;
			if (!dialog) return;
			if (openPanel === key && !dialog.open) {
				dialog.showModal();
			} else if (openPanel !== key && dialog.open) {
				dialog.close();
			}
		});
		const side =
			openPanel && openPanel !== "sky" ? PANEL_SIDES[openPanel] : null;
		document.body.classList.toggle("panel-open", openPanel !== null);
		document.body.classList.toggle("panel-from-right", side === "right");
		document.body.classList.toggle("panel-from-left", side === "left");
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
					// user action (ESC/backdrop) — navigate home. If urlPanelRef has
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
			const onClick = (e: MouseEvent) => {
				if (e.target === dialog) dialog.close();
			};
			dialog.addEventListener("close", onClose);
			dialog.addEventListener("click", onClick);
			cleanups.push(() => {
				dialog.removeEventListener("close", onClose);
				dialog.removeEventListener("click", onClick);
			});
		});
		return () => {
			for (const fn of cleanups) fn();
			document.body.classList.remove(
				"panel-open",
				"panel-from-left",
				"panel-from-right",
			);
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

			{TRIGGERS_ENABLED && (
				<>
					<dialog
						ref={careerRef}
						aria-labelledby={CAREER_PANEL_TITLE_ID}
						className={`panel-dialog slide-${PANEL_SIDES.career}`}
						style={
							{
								"--panel-bg": "#1e293b",
								"--panel-fg": "#f8fafc",
							} as React.CSSProperties
						}
					>
						<CareerPanel
							onClose={() => navigate({ to: "/", resetScroll: false })}
						/>
					</dialog>

					{STORIES.map((story) => (
						<dialog
							key={story.slug}
							ref={panelRefs[story.slug]}
							aria-labelledby={EARLY_DAYS_PANEL_TITLE_ID}
							className={`panel-dialog slide-${PANEL_SIDES[story.slug]}`}
							style={
								{
									"--panel-bg": story.panelBg,
									"--panel-fg": story.panelFg,
								} as React.CSSProperties
							}
						>
							<EarlyDaysPanel
								story={story}
								onClose={() => navigate({ to: "/", resetScroll: false })}
							/>
						</dialog>
					))}

					{PROJECTS.map((p) => (
						<dialog
							key={p.slug}
							ref={panelRefs[p.slug]}
							aria-labelledby={getProjectPanelTitleId(p.slug)}
							className={`panel-dialog slide-${PANEL_SIDES[p.slug]}`}
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
								onClose={() => navigate({ to: "/", resetScroll: false })}
							/>
						</dialog>
					))}

					{(
						Object.values(PERSONAL_BY_SLUG) as Array<
							(typeof PERSONAL_BY_SLUG)[PersonalSlug]
						>
					).map((item) => (
						<dialog
							key={item.slug}
							ref={panelRefs[item.slug]}
							aria-labelledby={getPersonalPanelTitleId(item.slug)}
							className={`panel-dialog slide-${PANEL_SIDES[item.slug]}`}
							style={
								{
									"--panel-bg": item.panelBg,
									"--panel-fg": item.panelFg,
								} as React.CSSProperties
							}
						>
							<PersonalPanel
								item={item}
								teaser={PERSONAL_TEASER[item.slug] ?? ""}
								onClose={() => navigate({ to: "/", resetScroll: false })}
							/>
						</dialog>
					))}
				</>
			)}
		</>
	);
}
