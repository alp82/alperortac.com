import { useEffect, useId, useRef } from "react";
import type { TravelPlace } from "../../../data/travel";

/*
 * MemoryCard (#travel-globe-subpage) - the boarding-pass click card shared by
 * both globe renderers (ports the prototype `.card` / `cardHTML`). Paper-cream
 * with a solid ink border and a stamp header ("Visited" crimson / "Next leg"
 * blue), the country title (`label ?? name`), and a mono memory line. The
 * memory copy lives in src/data/travel.ts and is unset until Alper fills it,
 * so a placeholder shows until then.
 *
 * Dialog semantics (WCAG 2.4.3 / 4.1.2): role="dialog" + aria-labelledby the
 * heading, focus moves to the close button on open (and again whenever the
 * selected place changes without a remount), and Escape closes it. Focus
 * restoration to the invoking element is the caller's job (TravelGlobe) since
 * it owns the invoking button/pointer target.
 */

const PLACEHOLDER_MEMORY = "20·· - a line of memory goes here";
const NEXT_MEMORY = "Next destination · 2027";

export function MemoryCard({
	place,
	isNext,
	onClose,
}: {
	place: TravelPlace;
	isNext: boolean;
	onClose: () => void;
}) {
	const title = place.label ?? place.name;
	const memory = place.memory ?? (isNext ? NEXT_MEMORY : PLACEHOLDER_MEMORY);
	const isPlaceholder = !place.memory;
	const headingId = useId();
	const closeRef = useRef<HTMLButtonElement | null>(null);

	// Move focus into the card on open, and again on every place change (the
	// card is reused across selections rather than remounted).
	// biome-ignore lint/correctness/useExhaustiveDependencies: only place.name (not the whole place object) should re-arm focus.
	useEffect(() => {
		closeRef.current?.focus();
	}, [place.name]);

	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") onClose();
		};
		document.addEventListener("keydown", onKeyDown);
		return () => document.removeEventListener("keydown", onKeyDown);
	}, [onClose]);

	return (
		<div
			className="travel-card open"
			role="dialog"
			aria-modal="true"
			aria-labelledby={headingId}
		>
			<button
				ref={closeRef}
				type="button"
				className="travel-card-close"
				aria-label="Close"
				onClick={onClose}
			>
				×
			</button>
			<div className={`travel-card-stamp${isNext ? " next" : ""}`}>
				{isNext ? "Next leg" : "Visited"}
			</div>
			<h3 id={headingId}>{title}</h3>
			<p
				className={isPlaceholder ? "travel-card-memory-placeholder" : undefined}
			>
				{memory}
			</p>
		</div>
	);
}
