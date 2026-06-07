import { useCallback, useState } from "react";
import { TOPICS, type TopicId } from "../../../data/topics";
import { INNERS, LINKS, SECTIONS } from "./index";
import type {
	AnyInnerParams,
	AnyLinkParams,
	AnySectionParams,
	InnerId,
	LinkId,
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

/** One topic's local stage pick + that pick's params. */
export type TopicStage = { id: SectionId; params: AnySectionParams };
/** One topic's local cluster pick + that pick's params. */
export type TopicCluster = { id: InnerId; params: AnyInnerParams };

export type ComposerState = {
	baseline: boolean;
	// Connector is GLOBAL — one pick for the whole band.
	link: LinkId;
	linkParams: AnyLinkParams;
	// Stage + cluster are LOCAL — every topic picks its own (with params).
	stages: Record<TopicId, TopicStage>;
	clusters: Record<TopicId, TopicCluster>;
};

export const DEFAULT_SECTION: SectionId = "parallax-depth";
export const DEFAULT_INNER: InnerId = "constellation";
export const DEFAULT_LINK: LinkId = "none";

/** Every topic starts on the baseline stage (centered-monolith) with defaults. */
function defaultStages(): Record<TopicId, TopicStage> {
	const out = {} as Record<TopicId, TopicStage>;
	for (const t of TOPICS) {
		out[t.id] = {
			id: DEFAULT_SECTION,
			params: { ...SECTIONS[DEFAULT_SECTION].defaults },
		};
	}
	return out;
}

/** Every topic starts on the default cluster (constellation) with its defaults. */
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
		link: DEFAULT_LINK,
		linkParams: { ...LINKS[DEFAULT_LINK].defaults },
		stages: defaultStages(),
		clusters: defaultClusters(),
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

	// Stage picks are per-topic (mirror of the cluster picks); the "All" variant
	// applies one stage to every topic. Switching id resets params to defaults.
	const setStage = useCallback((topicId: TopicId, section: SectionId) => {
		setState((s) => ({
			...s,
			stages: {
				...s.stages,
				[topicId]: { id: section, params: { ...SECTIONS[section].defaults } },
			},
		}));
	}, []);
	const setAllStages = useCallback((section: SectionId) => {
		setState((s) => {
			const stages = {} as Record<TopicId, TopicStage>;
			for (const t of TOPICS) {
				stages[t.id] = {
					id: section,
					params: { ...SECTIONS[section].defaults },
				};
			}
			return { ...s, stages };
		});
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
	// "All" editing: apply one inside pick (with its defaults) to every topic.
	const setAllInners = useCallback((inner: InnerId) => {
		setState((s) => {
			const clusters = {} as Record<TopicId, TopicCluster>;
			for (const t of TOPICS) {
				clusters[t.id] = { id: inner, params: { ...INNERS[inner].defaults } };
			}
			return { ...s, clusters };
		});
	}, []);
	const setLink = useCallback((link: LinkId) => {
		setState((s) => ({
			...s,
			link,
			linkParams: { ...LINKS[link].defaults },
		}));
	}, []);

	// Patches target the CURRENT stage's own fields (per-topic, or all topics).
	// Every control is range-bounded or enumerated, so a plain merge is valid.
	const patchStageParams = useCallback(
		(topicId: TopicId, patch: Partial<AnySectionParams>) =>
			setState((s) => ({
				...s,
				stages: {
					...s.stages,
					[topicId]: {
						...s.stages[topicId],
						params: {
							...s.stages[topicId].params,
							...patch,
						} as AnySectionParams,
					},
				},
			})),
		[],
	);
	const patchAllStageParams = useCallback(
		(patch: Partial<AnySectionParams>) =>
			setState((s) => {
				const stages = {} as Record<TopicId, TopicStage>;
				for (const t of TOPICS) {
					const st = s.stages[t.id];
					stages[t.id] = {
						...st,
						params: { ...st.params, ...patch } as AnySectionParams,
					};
				}
				return { ...s, stages };
			}),
		[],
	);
	const patchInnerParams = useCallback(
		(topicId: TopicId, patch: Partial<AnyInnerParams>) =>
			setState((s) => ({
				...s,
				clusters: {
					...s.clusters,
					[topicId]: {
						...s.clusters[topicId],
						params: {
							...s.clusters[topicId].params,
							...patch,
						} as AnyInnerParams,
					},
				},
			})),
		[],
	);
	// "All" editing: merge a param patch into every topic's cluster.
	const patchAllInnerParams = useCallback(
		(patch: Partial<AnyInnerParams>) =>
			setState((s) => {
				const clusters = {} as Record<TopicId, TopicCluster>;
				for (const t of TOPICS) {
					const c = s.clusters[t.id];
					clusters[t.id] = {
						...c,
						params: { ...c.params, ...patch } as AnyInnerParams,
					};
				}
				return { ...s, clusters };
			}),
		[],
	);
	const patchLinkParams = useCallback(
		(patch: Partial<AnyLinkParams>) =>
			setState((s) => ({
				...s,
				linkParams: { ...s.linkParams, ...patch } as AnyLinkParams,
			})),
		[],
	);

	const reset = useCallback(() => setState(defaultState()), []);

	return {
		state,
		setBaseline,
		setStage,
		setAllStages,
		setInner,
		setAllInners,
		setLink,
		patchStageParams,
		patchAllStageParams,
		patchInnerParams,
		patchAllInnerParams,
		patchLinkParams,
		reset,
	};
}

/**
 * Single-line copy-spec string, namespaced per layer. The section/inner/link.*
 * keys are whatever the SELECTED style exposes (per-style params, emitted in
 * defaults order), so the line self-describes which knobs are live. Per-topic
 * inner.<topic> blocks are emitted only for topics that deviate from the default
 * cluster (DEFAULT_INNER + its default params); link.* drops entirely when
 * link === none. Baseline on → just `baseline: on`.
 *
 * e.g. `section: split-stage | section.accent: topic | section.height: 90 |
 * inner.coding: comic | inner.coding.density: roomy | inner.coding.halftone: on |
 * inner.coding.palette: classic | link: trail-dashes | link.color: earth |
 * link.weight: 2 | link.curve: 50 | link.dash: standard | link.footprints: off`
 */
export function buildComposerSpec(state: ComposerState): string {
	if (state.baseline) return "baseline: on";

	const parts: string[] = [];
	// Stages are per-topic; emit only topics that differ from the default stage
	// (an omitted topic = DEFAULT_SECTION). Per-stage params in defaults order.
	for (const t of TOPICS) {
		const st = state.stages[t.id];
		if (st.id === DEFAULT_SECTION) continue;
		parts.push(`section.${t.id}: ${st.id}`);
		for (const [k, v] of Object.entries(st.params)) {
			const val = typeof v === "boolean" ? (v ? "on" : "off") : v;
			parts.push(`section.${t.id}.${k}: ${val}`);
		}
	}

	// Clusters are per-topic; emit only topics that DEVIATE from the default
	// cluster (DEFAULT_INNER with its default params). A topic left untouched on
	// the default is omitted; any id switch or param tweak makes it emit.
	const innerDefaults = INNERS[DEFAULT_INNER].defaults as Record<
		string,
		unknown
	>;
	for (const t of TOPICS) {
		const c = state.clusters[t.id];
		const cp = c.params as Record<string, unknown>;
		if (
			c.id === DEFAULT_INNER &&
			Object.keys(innerDefaults).every((k) => cp[k] === innerDefaults[k])
		) {
			continue;
		}
		parts.push(`inner.${t.id}: ${c.id}`);
		// Per-style params, in defaults order; booleans as on/off.
		for (const [k, v] of Object.entries(c.params)) {
			const val = typeof v === "boolean" ? (v ? "on" : "off") : v;
			parts.push(`inner.${t.id}.${k}: ${val}`);
		}
	}

	parts.push(`link: ${state.link}`);

	if (state.link !== "none") {
		// Per-connector params (base + signature), in defaults order.
		for (const [k, v] of Object.entries(state.linkParams)) {
			const val = typeof v === "boolean" ? (v ? "on" : "off") : v;
			parts.push(`link.${k}: ${val}`);
		}
	}

	return parts.join(" | ");
}
