/*
 * PROTOTYPE - floating variant switcher for the Early Days era-media
 * prototype (wayfinder #28). Renders only when `?variant=` is present.
 */
import { useEffect } from "react";
import type { EraMediaVariant } from "./useEraMediaVariant";

const ORDER: EraMediaVariant[] = ["off", "amber", "green", "cream", "bronze"];

const LABELS: Record<EraMediaVariant, string> = {
	off: "OFF - soft timeline, new prose (baseline)",
	amber: "AMBER - bright phosphor (reference)",
	green: "GREEN - classic terminal phosphor",
	cream: "CREAM - muted parchment, near the prose",
	bronze: "BRONZE - dim warm, recedes into the rust",
};

export function EraMediaSwitcher({
	variant,
	onChange,
}: {
	variant: EraMediaVariant;
	onChange: (v: EraMediaVariant) => void;
}) {
	const cycle = (dir: 1 | -1) => {
		const i = ORDER.indexOf(variant);
		const next = ORDER[(i + dir + ORDER.length) % ORDER.length];
		if (next) onChange(next);
	};

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			const t = e.target as HTMLElement | null;
			if (
				t &&
				(t.tagName === "INPUT" ||
					t.tagName === "TEXTAREA" ||
					t.isContentEditable)
			)
				return;
			if (e.key === "ArrowLeft") cycle(-1);
			if (e.key === "ArrowRight") cycle(1);
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	});

	return (
		<div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 rounded-full bg-slate-900 text-white px-4 py-2 shadow-xl text-sm font-semibold select-none border border-white/25">
			<button
				type="button"
				onClick={() => cycle(-1)}
				className="px-1 hover:opacity-70"
				aria-label="previous variant"
			>
				◀
			</button>
			<span className="whitespace-nowrap">{LABELS[variant]}</span>
			<button
				type="button"
				onClick={() => cycle(1)}
				className="px-1 hover:opacity-70"
				aria-label="next variant"
			>
				▶
			</button>
		</div>
	);
}
