import { useEffect, useRef, useState } from "react";
import { PANEL_OPEN_CLASS } from "../../data/sections";
import { NIGHT_UI_THRESHOLD, sectionProgressAt } from "../../data/skyCurve";

/*
 * Shared brutalist section heading: big uppercase h2 with the white drop
 * shadow, plus an optional accent underline. The night/day text color is
 * frozen once at mount from the section's own scroll position — no scroll
 * or resize listeners, no timers — so the heading never flips mid-scroll.
 *
 * Accepted: the frozen phase is measured once (mount + the fonts.ready
 * re-seed below) and does NOT re-measure on live DesignModeHost/composer
 * edits — inner/density/param changes that reflow articles won't retrigger
 * this. Composer editing is a design-tooling interaction, not the visitor
 * flow, so this is intentional.
 */

export function useSectionNightPhase(
	ref: React.RefObject<HTMLElement | null>,
	enabled = true,
): boolean {
	const [night, setNight] = useState(false);
	// biome-ignore lint/correctness/useExhaustiveDependencies: ref.current is read once on mount and never swaps; the ref attaches before effects run.
	useEffect(() => {
		// Override gate: when the caller supplies an explicit phase, skip the
		// measurement path entirely — no geometry reads at all.
		if (!enabled) return;
		const measure = () => {
			// No panel-open guard here: this mount-time read is correct
			// (untransformed) only because section mount effects run BEFORE
			// PanelHost's panel-open toggle — guaranteed by PanelHost sitting
			// after .main-shell in _layout.tsx's JSX (React commits/effects
			// top-down). Reordering that JSX would make direct-URL subpage
			// mounts read transformed rects here.
			const el = ref.current;
			if (!el) return;
			const rect = el.getBoundingClientRect();
			const centerY = rect.top + window.scrollY + rect.height / 2;
			setNight(
				sectionProgressAt(
					centerY,
					document.documentElement.scrollHeight,
					window.innerHeight,
				) >= NIGHT_UI_THRESHOLD,
			);
		};
		// One-shot mount seed (matches the _layout.tsx idiom): the section's
		// document position doesn't change, so no re-derivation is needed.
		measure();
		// One-shot re-seed once web fonts land: font swap can reflow the page
		// and shift the section's document position. Skipped while a subpage is
		// open (body.panel-open transforms the main shell, so rects are wrong)
		// and is NOT retried on panel-close — accepted limitation: on a
		// direct-URL subpage load with uncached fonts, fonts.ready can resolve
		// while the panel is open, so that section permanently keeps its
		// pre-font-swap geometry. The failure window is narrow (a section
		// whose progress sits within ~0.006 of NIGHT_UI_THRESHOLD), so we defer
		// adding panel-state observation/coupling to this hook for it.
		// Optional chaining: jsdom has no FontFaceSet.
		let cancelled = false;
		document.fonts?.ready.then(() => {
			if (cancelled) return;
			if (document.body.classList.contains(PANEL_OPEN_CLASS)) return;
			measure();
		});
		return () => {
			cancelled = true;
		};
	}, [enabled]);
	return night;
}

export function AccentUnderline({
	accent,
	align = "center",
}: {
	accent: string;
	align?: "center" | "left";
}) {
	return (
		<span
			aria-hidden="true"
			className={`${align === "center" ? "mx-auto" : "ml-0"} mt-4 block h-1.5 w-20 rounded-full`}
			style={{ background: accent }}
		/>
	);
}

export function SectionTitle({
	children,
	accent,
	night,
	underlineAlign = "center",
	size = "text-6xl md:text-8xl",
	className,
}: {
	children: React.ReactNode;
	accent?: string;
	night?: boolean;
	underlineAlign?: "center" | "left";
	size?: string;
	className?: string;
}) {
	const rootRef = useRef<HTMLDivElement>(null);
	// The caller's explicit phase wins via ?? (not ||): night={false} must
	// force day even though false is falsy.
	const measured = useSectionNightPhase(rootRef, night === undefined);
	const isNight = night ?? measured;
	return (
		<div ref={rootRef} className={className}>
			<h2
				className={`${size} font-black uppercase tracking-tighter leading-[0.9] drop-shadow-[4px_4px_0px_rgba(255,255,255,0.5)] ${isNight ? "text-white" : "text-slate-900"}`}
			>
				{children}
			</h2>
			{accent ? (
				<AccentUnderline accent={accent} align={underlineAlign} />
			) : null}
		</div>
	);
}
