/*
 * PROTOTYPE — floating variant switcher for the movies-tv poster prototype.
 * Renders only when the `?variant=` param is present (and never in prod
 * builds), so normal browsing and tests never see it.
 */
import { useEffect } from "react";
import type { PrototypeVariant } from "./usePrototypeVariant";

const ORDER: PrototypeVariant[] = ["a", "b", "off"];

const LABELS: Record<PrototypeVariant, string> = {
	a: "A — grid under prose (trigger)",
	b: "B — inside the billboard",
	off: "OFF — locked look",
};

export function PrototypeSwitcher({
	variant,
	onChange,
}: {
	variant: PrototypeVariant;
	onChange: (v: PrototypeVariant) => void;
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
		<div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 rounded-full bg-fuchsia-700 text-white px-4 py-2 shadow-xl text-sm font-semibold select-none">
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
