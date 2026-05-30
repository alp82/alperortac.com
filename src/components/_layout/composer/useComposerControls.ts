import { useCallback, useState } from "react";
import { TOPICS, type TopicId } from "../../../data/topics";
import { INNERS, LINKS, SECTIONS } from "./index";
import type {
	AnySectionParams,
	InnerId,
	InnerParams,
	LinkId,
	LinkParams,
	SectionId,
} from "./types";

/*
 * DEV-ONLY composer state.
 *
 * Holds the full composition — a baseline bypass flag, one GLOBAL stage +
 * connector pick (with params), and a LOCAL cluster pick (with params) per
 * topic. State ALWAYS initializes to the
 * deterministic defaults (no localStorage), so the composition renders
 * identically on the server and the first client paint — no defaults-then-swap
 * height growth after scroll restoration. Selections live for the session only;
 * they no longer persist across reloads.
 *
 * Nothing is written onto <html> — the composition is threaded down to the
 * dispatcher as props, keeping LayoutHost free of any composer import so the
 * whole tree stays strippable in prod.
 *
 * Planner: gated behind import.meta.env.DEV at the call site; removed once a
 * composition is locked (see CLEANUP_NEEDED).
 */

/** One topic's local cluster pick + that pick's params. */
export type TopicCluster = { id: InnerId; params: InnerParams };

export type ComposerState = {
	baseline: boolean;
	// Stage + connector are GLOBAL — one pick for the whole band.
	section: SectionId;
	sectionParams: AnySectionParams;
	link: LinkId;
	linkParams: LinkParams;
	// Cluster is LOCAL — every topic picks its own inner + params.
	clusters: Record<TopicId, TopicCluster>;
};

export const DEFAULT_SECTION: SectionId = "centered-monolith";
export const DEFAULT_INNER: InnerId = "rich-card";
export const DEFAULT_LINK: LinkId = "none";

/** Every topic starts on the baseline cluster (rich-card) with its defaults. */
function defaultClusters(): Record<TopicId, TopicCluster> {
	const out = {} as Record<TopicId, TopicCluster>;
	for (const t of TOPICS) {
		out[t.id] = {
			id: DEFAULT_INNER,
			params: { ...INNERS[DEFAULT_INNER].defaults },
		};
	}
	return out;
}

/**
 * The deterministic default composition. Identical on server and client (no
 * localStorage), so `_layout`'s composer init and the hook's initial state agree
 * → no hydration mismatch, no post-mount height swap. Exported for `_layout`'s
 * DEV-only composer seed.
 */
export function defaultState(): ComposerState {
	return {
		baseline: false,
		section: DEFAULT_SECTION,
		sectionParams: { ...SECTIONS[DEFAULT_SECTION].defaults },
		link: DEFAULT_LINK,
		linkParams: { ...LINKS[DEFAULT_LINK].defaults },
		clusters: defaultClusters(),
	};
}

const clamp = (n: number, lo: number, hi: number) =>
	Math.min(Math.max(n, lo), hi);

function oneOf<T extends string>(v: unknown, allowed: readonly T[], fb: T): T {
	return typeof v === "string" && (allowed as readonly string[]).includes(v)
		? (v as T)
		: fb;
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

export function useComposerControls() {
	// Always initialize to the deterministic defaults (no localStorage). The
	// composition is the same on server and first client paint, so the band
	// renders at its settled height immediately — no defaults-then-swap growth
	// after the browser restores scroll. Live in-session editing still works via
	// the setters below; selections just don't persist across reloads.
	const [state, setState] = useState<ComposerState>(defaultState);

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
	// Cluster picks are per-topic: setting/patching takes the topic id.
	const setInner = useCallback((topicId: TopicId, inner: InnerId) => {
		setState((s) => ({
			...s,
			clusters: {
				...s.clusters,
				[topicId]: { id: inner, params: { ...INNERS[inner].defaults } },
			},
		}));
	}, []);
	const setLink = useCallback((link: LinkId) => {
		setState((s) => ({
			...s,
			link,
			linkParams: { ...LINKS[link].defaults },
		}));
	}, []);

	// The panel only ever patches the CURRENT stage's own fields, and every
	// control is range-bounded (sliders) or enumerated (segmented/swatch), so a
	// plain merge always yields a valid shape — no sanitize pass needed.
	const patchSectionParams = useCallback(
		(patch: Partial<AnySectionParams>) =>
			setState((s) => ({
				...s,
				sectionParams: { ...s.sectionParams, ...patch } as AnySectionParams,
			})),
		[],
	);
	const patchInnerParams = useCallback(
		(topicId: TopicId, patch: Partial<InnerParams>) =>
			setState((s) => ({
				...s,
				clusters: {
					...s.clusters,
					[topicId]: {
						...s.clusters[topicId],
						params: { ...s.clusters[topicId].params, ...patch },
					},
				},
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
 * Single-line copy-spec string, namespaced per layer. The section.* keys are
 * whatever the SELECTED stage exposes (per-stage params, emitted in defaults
 * order), so the line self-describes which stage's knobs are live. Omits the
 * curve key for straight connectors and drops link.* entirely when
 * link === none. When baseline is on, emits just `baseline: on`.
 *
 * e.g. `section: split-stage | section.accent: topic | section.height: 90 |
 * section.ratio: 58 | section.side: left | inner.coding: comic |
 * inner.coding.color: accent | inner.coding.density: cozy | inner.coding.motif:
 * on | link: river-ribbon | link.color: sky | link.weight: 3 | link.curve: 50`
 */
export function buildComposerSpec(state: ComposerState): string {
	if (state.baseline) return "baseline: on";

	const parts: string[] = [`section: ${state.section}`];
	// Per-stage params, in their defaults order; booleans as on/off.
	for (const [k, v] of Object.entries(state.sectionParams)) {
		const val = typeof v === "boolean" ? (v ? "on" : "off") : v;
		parts.push(`section.${k}: ${val}`);
	}

	// Clusters are per-topic; emit only topics that differ from the baseline
	// rich-card (an omitted topic = rich-card). rich-card's chrome is fixed, so
	// even chosen explicitly its inner.* params carry no meaning — hence the
	// continue covers both cases.
	for (const t of TOPICS) {
		const c = state.clusters[t.id];
		if (c.id === "rich-card") continue;
		parts.push(`inner.${t.id}: ${c.id}`);
		parts.push(`inner.${t.id}.color: ${c.params.color}`);
		parts.push(`inner.${t.id}.density: ${c.params.density}`);
		parts.push(`inner.${t.id}.motif: ${c.params.motif ? "on" : "off"}`);
	}

	parts.push(`link: ${state.link}`);

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
