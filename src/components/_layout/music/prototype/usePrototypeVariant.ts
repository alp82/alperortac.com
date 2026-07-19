/*
 * PROTOTYPE — reads/writes the `?variant=` search param for the music
 * snippet-player prototype (wayfinder #27). Deliberately not wired into the
 * TanStack router search schema: throwaway plumbing, zero footprint when the
 * param is absent. Copied from the movies poster-grid prototype.
 */
import { useCallback, useEffect, useState } from "react";

export type PrototypeVariant = "a" | "b" | "c" | "d" | "off";

const KEY = "variant";

function read(): PrototypeVariant | null {
	if (typeof window === "undefined") return null;
	const raw = new URLSearchParams(window.location.search).get(KEY);
	if (raw === "a" || raw === "b" || raw === "c" || raw === "d" || raw === "off")
		return raw;
	return null;
}

/**
 * Returns null when the param is absent (prototype fully dormant — tests and
 * normal browsing never see it). Setting a variant rewrites the URL in place
 * so the state is shareable and reload-stable.
 */
export function usePrototypeVariant(): [
	PrototypeVariant | null,
	(v: PrototypeVariant) => void,
] {
	const [variant, setVariant] = useState<PrototypeVariant | null>(read);

	useEffect(() => {
		const onPop = () => setVariant(read());
		window.addEventListener("popstate", onPop);
		return () => window.removeEventListener("popstate", onPop);
	}, []);

	const set = useCallback((v: PrototypeVariant) => {
		const url = new URL(window.location.href);
		url.searchParams.set(KEY, v);
		window.history.replaceState(window.history.state, "", url);
		setVariant(v);
	}, []);

	return [variant, set];
}
