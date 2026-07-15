import { useCallback, useState } from "react";
import { TOPICS, type TopicId } from "../../../data/topics";
import { IDENTITIES } from "./identities";
import { INNERS, LINKS } from "./index";
import type { AnyInnerParams, AnyLinkParams, InnerId, LinkId } from "./types";

/*
 * Composer state.
 *
 * Holds the full composition - a baseline bypass flag, one GLOBAL connector
 * pick (with params), and a LOCAL cluster pick (with params) per topic. State
 * ALWAYS initializes to the deterministic defaults (no localStorage), so the
 * composition renders identically on the server and the first client paint -
 * no defaults-then-swap height growth after scroll restoration. Selections
 * live for the session only; they don't persist across reloads.
 *
 * Nothing is written onto <html> - the composition is threaded down to the
 * dispatcher as props, keeping LayoutHost free of any composer import.
 */

/** One topic's local cluster pick + that pick's params. */
export type TopicCluster = { id: InnerId; params: AnyInnerParams };

export type ComposerState = {
	baseline: boolean;
	// Connector is GLOBAL - one pick for the whole band.
	link: LinkId;
	linkParams: AnyLinkParams;
	// Cluster is LOCAL - every topic picks its own (with params).
	clusters: Record<TopicId, TopicCluster>;
};

export const DEFAULT_INNER: InnerId = "parallax-depth";
export const DEFAULT_LINK: LinkId = "none";

/** Every topic starts on its registry-locked cluster (see identities.ts). */
function defaultClusters(): Record<TopicId, TopicCluster> {
	const out = {} as Record<TopicId, TopicCluster>;
	for (const t of TOPICS) {
		out[t.id] = {
			id: IDENTITIES[t.id].inner.id,
			params: { ...IDENTITIES[t.id].inner.params },
		};
	}
	return out;
}

/**
 * The deterministic default composition. Identical on server and client (no
 * localStorage), so `_layout`'s composer init and the hook's initial state agree
 * → no hydration mismatch, no post-mount height swap. Exported for `_layout`'s
 * composer seed.
 */
export function defaultState(): ComposerState {
	return {
		baseline: false,
		link: DEFAULT_LINK,
		linkParams: { ...LINKS[DEFAULT_LINK].defaults },
		clusters: defaultClusters(),
	};
}

/**
 * Module-level singleton evaluated once. Both `_layout`'s `useState` seed and
 * the hook's `useState` seed reference this exact object, so `Object.is` returns
 * true and React bails the redundant subtree re-render on cold prod load.
 * Never mutated - every setter in `useComposerControls` spreads into a new object.
 * `reset` intentionally calls `defaultState()` (fresh object) instead of this.
 */
export const DEFAULT_STATE: ComposerState = defaultState();

export function useComposerControls() {
	// Always initialize to the deterministic defaults (no localStorage). The
	// composition is the same on server and first client paint, so the band
	// renders at its settled height immediately - no defaults-then-swap growth
	// after the browser restores scroll. Live in-session editing still works via
	// the setters below; selections just don't persist across reloads.
	const [state, setState] = useState<ComposerState>(DEFAULT_STATE);

	const setBaseline = useCallback(
		(baseline: boolean) => setState((s) => ({ ...s, baseline })),
		[],
	);

	// Cluster picks are per-topic: setting/patching takes the topic id.
	// Switching id resets params to defaults.
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

	// Patches target the CURRENT cluster's own fields (per-topic, or all topics).
	// Every control is range-bounded or enumerated, so a plain merge is valid.
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
		setInner,
		setAllInners,
		setLink,
		patchInnerParams,
		patchAllInnerParams,
		patchLinkParams,
		reset,
	};
}

/**
 * Single-line copy-spec string, namespaced per layer. The inner/link.* keys
 * are whatever the SELECTED style exposes (per-style params, emitted in
 * defaults order), so the line self-describes which knobs are live. Per-topic
 * inner.<topic> blocks are emitted only for topics that deviate from their
 * LOCKED identity (IDENTITIES[topic].inner - see identities.ts), so an
 * all-at-lock composition emits exactly `link: none`; link.* drops entirely
 * when link === none. Baseline on → just `baseline: on`.
 *
 * e.g. `inner.coding: comic | inner.coding.density: roomy |
 * inner.coding.halftone: on | inner.coding.palette: classic |
 * link: trail-dashes | link.color: earth | link.weight: 2 | link.curve: 50 |
 * link.dash: standard | link.footprints: off`
 */
export function buildComposerSpec(state: ComposerState): string {
	if (state.baseline) return "baseline: on";

	const parts: string[] = [];

	// Clusters are per-topic; emit only topics that DEVIATE from their LOCKED
	// identity (IDENTITIES[topic].inner). A topic left at its lock is omitted;
	// any id switch or param tweak away from the lock makes it emit.
	for (const t of TOPICS) {
		const c = state.clusters[t.id];
		const cp = c.params as Record<string, unknown>;
		const lock = IDENTITIES[t.id].inner;
		const lp = lock.params as Record<string, unknown>;
		// Deliberate: lock-side keys only - foreign keys merged via patchAllInnerParams
		// do not render and must not resurrect a topic into the spec. Not a deep-equal.
		if (c.id === lock.id && Object.keys(lp).every((k) => cp[k] === lp[k])) {
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
