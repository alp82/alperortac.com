/*
 * PROTOTYPE - reads/writes the `?variant=` search param for the Early Days
 * era-media prototype (wayfinder #28). Not wired into the TanStack router
 * search schema: throwaway plumbing, zero footprint when the param is absent
 * (tests and normal browsing never see it). Mirrors the music #27 prototype.
 */
import { useCallback, useEffect, useState } from "react";

export type EraMediaVariant = "off" | "amber" | "green" | "cream" | "bronze";

const KEY = "variant";
const VALID = new Set<string>(["off", "amber", "green", "cream", "bronze"]);

function read(): EraMediaVariant | null {
	if (typeof window === "undefined") return null;
	const raw = new URLSearchParams(window.location.search).get(KEY);
	return raw && VALID.has(raw) ? (raw as EraMediaVariant) : null;
}

export function useEraMediaVariant(): [
	EraMediaVariant | null,
	(v: EraMediaVariant) => void,
] {
	const [variant, setVariant] = useState<EraMediaVariant | null>(read);

	useEffect(() => {
		const onPop = () => setVariant(read());
		window.addEventListener("popstate", onPop);
		return () => window.removeEventListener("popstate", onPop);
	}, []);

	const set = useCallback((v: EraMediaVariant) => {
		const url = new URL(window.location.href);
		url.searchParams.set(KEY, v);
		window.history.replaceState(window.history.state, "", url);
		setVariant(v);
	}, []);

	return [variant, set];
}
