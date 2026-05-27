import { useCallback, useEffect, useState } from "react";
import { INNERS, LINKS, SECTIONS } from "./index";
import type {
	InnerId,
	InnerParams,
	LinkId,
	LinkParams,
	SectionId,
	SectionParams,
} from "./types";

/*
 * DEV-ONLY composer state.
 *
 * Holds the full composition — a baseline bypass flag plus one pick + that
 * pick's params for each of the three layers — and persists it to localStorage
 * with the SSR-safe hydrate pattern (start at defaults on the server + first
 * paint, then read storage on mount so we never clobber a stored composition).
 *
 * Hydration sanitizes every field: unknown ids fall back to the layer default,
 * params are clamped/whitelisted, and the section height is clamped to the
 * SELECTED style's range. Nothing is written onto <html> — the composition is
 * threaded down to the dispatcher as props, keeping LayoutHost free of any
 * composer import so the whole tree stays strippable in prod.
 *
 * Planner: gated behind import.meta.env.DEV at the call site; removed once a
 * composition is locked (see CLEANUP_NEEDED).
 */

export type ComposerState = {
	baseline: boolean;
	section: SectionId;
	sectionParams: SectionParams;
	inner: InnerId;
	innerParams: InnerParams;
	link: LinkId;
	linkParams: LinkParams;
};

export const DEFAULT_SECTION: SectionId = "centered-monolith";
export const DEFAULT_INNER: InnerId = "minimal";
export const DEFAULT_LINK: LinkId = "none";

const STORAGE_KEY = "alp-design-composer-v1";

function defaultState(): ComposerState {
	return {
		baseline: false,
		section: DEFAULT_SECTION,
		sectionParams: { ...SECTIONS[DEFAULT_SECTION].defaults },
		inner: DEFAULT_INNER,
		innerParams: { ...INNERS[DEFAULT_INNER].defaults },
		link: DEFAULT_LINK,
		linkParams: { ...LINKS[DEFAULT_LINK].defaults },
	};
}

const clamp = (n: number, lo: number, hi: number) =>
	Math.min(Math.max(n, lo), hi);

function isSectionId(v: unknown): v is SectionId {
	return typeof v === "string" && v in SECTIONS;
}
function isInnerId(v: unknown): v is InnerId {
	return typeof v === "string" && v in INNERS;
}
function isLinkId(v: unknown): v is LinkId {
	return typeof v === "string" && v in LINKS;
}

function oneOf<T extends string>(v: unknown, allowed: readonly T[], fb: T): T {
	return typeof v === "string" && (allowed as readonly string[]).includes(v)
		? (v as T)
		: fb;
}

function sanitizeSectionParams(
	section: SectionId,
	raw: unknown,
): SectionParams {
	const def = SECTIONS[section];
	const d = def.defaults;
	const o = (raw ?? {}) as Record<string, unknown>;
	const [lo, hi] = def.heightRange;
	return {
		accent: oneOf(o.accent, ["topic", "fixed", "none"] as const, d.accent),
		align: oneOf(
			o.align,
			["center", "left", "right", "bottom"] as const,
			d.align,
		),
		scrim: clamp(typeof o.scrim === "number" ? o.scrim : d.scrim, 0, 80),
		height: clamp(typeof o.height === "number" ? o.height : d.height, lo, hi),
	};
}

function sanitizeInnerParams(inner: InnerId, raw: unknown): InnerParams {
	const d = INNERS[inner].defaults;
	const o = (raw ?? {}) as Record<string, unknown>;
	return {
		color: oneOf(o.color, ["accent", "neutral", "inverted"] as const, d.color),
		density: oneOf(
			o.density,
			["cozy", "comfortable", "roomy"] as const,
			d.density,
		),
		motif: typeof o.motif === "boolean" ? o.motif : d.motif,
	};
}

function sanitizeLinkParams(link: LinkId, raw: unknown): LinkParams {
	const d = LINKS[link].defaults;
	const o = (raw ?? {}) as Record<string, unknown>;
	return {
		color: oneOf(o.color, ["ink", "sky", "earth", "accent"] as const, d.color),
		weight: clamp(typeof o.weight === "number" ? o.weight : d.weight, 1, 8),
		curve: clamp(typeof o.curve === "number" ? o.curve : d.curve, 0, 100),
		height: clamp(typeof o.height === "number" ? o.height : d.height, 20, 150),
		blend: clamp(typeof o.blend === "number" ? o.blend : d.blend, 0, 100),
		animate: typeof o.animate === "boolean" ? o.animate : d.animate,
	};
}

function sanitize(raw: unknown): ComposerState {
	const o = (raw ?? {}) as Record<string, unknown>;
	const section = isSectionId(o.section) ? o.section : DEFAULT_SECTION;
	const inner = isInnerId(o.inner) ? o.inner : DEFAULT_INNER;
	const link = isLinkId(o.link) ? o.link : DEFAULT_LINK;
	return {
		baseline: typeof o.baseline === "boolean" ? o.baseline : false,
		section,
		sectionParams: sanitizeSectionParams(section, o.sectionParams),
		inner,
		innerParams: sanitizeInnerParams(inner, o.innerParams),
		link,
		linkParams: sanitizeLinkParams(link, o.linkParams),
	};
}

export function useComposerControls() {
	const [state, setState] = useState<ComposerState>(defaultState);
	const [hydrated, setHydrated] = useState(false);

	// Hydrate from localStorage on mount (client-only; SSR-safe).
	useEffect(() => {
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) setState(sanitize(JSON.parse(stored)));
		} catch {
			// localStorage unavailable / malformed — keep defaults
		}
		setHydrated(true);
	}, []);

	// Persist post-hydration only (never overwrite a stored composition with the
	// default on first paint).
	useEffect(() => {
		if (!hydrated) return;
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
		} catch {
			// localStorage unavailable — live preview still works this session
		}
	}, [state, hydrated]);

	const setBaseline = useCallback(
		(baseline: boolean) => setState((s) => ({ ...s, baseline })),
		[],
	);

	// Switching a layer's id resets that layer's params to the new pick's
	// defaults (and re-clamps height to the new section's range).
	const setSection = useCallback((section: SectionId) => {
		setState((s) => ({
			...s,
			section,
			sectionParams: { ...SECTIONS[section].defaults },
		}));
	}, []);
	const setInner = useCallback((inner: InnerId) => {
		setState((s) => ({
			...s,
			inner,
			innerParams: { ...INNERS[inner].defaults },
		}));
	}, []);
	const setLink = useCallback((link: LinkId) => {
		setState((s) => ({
			...s,
			link,
			linkParams: { ...LINKS[link].defaults },
		}));
	}, []);

	const patchSectionParams = useCallback(
		(patch: Partial<SectionParams>) =>
			setState((s) => ({
				...s,
				sectionParams: sanitizeSectionParams(s.section, {
					...s.sectionParams,
					...patch,
				}),
			})),
		[],
	);
	const patchInnerParams = useCallback(
		(patch: Partial<InnerParams>) =>
			setState((s) => ({
				...s,
				innerParams: { ...s.innerParams, ...patch },
			})),
		[],
	);
	const patchLinkParams = useCallback(
		(patch: Partial<LinkParams>) =>
			setState((s) => ({
				...s,
				linkParams: sanitizeLinkParams(s.link, { ...s.linkParams, ...patch }),
			})),
		[],
	);

	const reset = useCallback(() => setState(defaultState()), []);

	return {
		state,
		setBaseline,
		setSection,
		setInner,
		setLink,
		patchSectionParams,
		patchInnerParams,
		patchLinkParams,
		reset,
	};
}

/**
 * Single-line copy-spec string, namespaced per layer. Stable key order. Omits
 * the curve key for straight connectors and drops link.* entirely when
 * link === none. When baseline is on, emits just `baseline: on`.
 *
 * e.g. `section: split-stage | section.accent: topic | section.align: left |
 * section.scrim: 40 | section.height: 90 | inner: comic | inner.color: accent |
 * inner.density: cozy | link: river-ribbon | link.color: sky | link.weight: 3 |
 * link.curve: 50 | link.height: 45 | link.blend: 24 | link.animate: on`
 */
export function buildComposerSpec(state: ComposerState): string {
	if (state.baseline) return "baseline: on";

	const sp = state.sectionParams;
	const ip = state.innerParams;
	const parts: string[] = [
		`section: ${state.section}`,
		`section.accent: ${sp.accent}`,
		`section.align: ${sp.align}`,
		`section.scrim: ${sp.scrim}`,
		`section.height: ${sp.height}`,
		`inner: ${state.inner}`,
		`inner.color: ${ip.color}`,
		`inner.density: ${ip.density}`,
		`inner.motif: ${ip.motif ? "on" : "off"}`,
		`link: ${state.link}`,
	];

	if (state.link !== "none") {
		const lp = state.linkParams;
		parts.push(`link.color: ${lp.color}`);
		parts.push(`link.weight: ${lp.weight}`);
		if (LINKS[state.link].hasCurve) parts.push(`link.curve: ${lp.curve}`);
		parts.push(`link.height: ${lp.height}`);
		parts.push(`link.blend: ${lp.blend}`);
		parts.push(`link.animate: ${lp.animate ? "on" : "off"}`);
	}

	return parts.join(" | ");
}
