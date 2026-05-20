import { useCallback, useEffect, useRef } from "react";

type DualRangeSliderProps = {
	startValue: number;
	endValue: number;
	min?: number;
	max?: number;
	step?: number;
	minGap?: number;
	onChange: (start: number, end: number) => void;
	startAriaLabel?: string;
	endAriaLabel?: string;
	disabled?: boolean;
};

/**
 * Two stacked native `<input type="range">` elements that share a track
 * and clamp against each other through imperative refs. Mirrors the
 * dual-range from `.prototypes/design-sky-gradient.html` so the host
 * is free of layout magic.
 */
export function DualRangeSlider({
	startValue,
	endValue,
	min = 0,
	max = 1,
	step = 0.001,
	minGap = 0.001,
	onChange,
	startAriaLabel = "Range start",
	endAriaLabel = "Range end",
	disabled = false,
}: DualRangeSliderProps) {
	const startRef = useRef<HTMLInputElement>(null);
	const endRef = useRef<HTMLInputElement>(null);
	const fillRef = useRef<HTMLDivElement>(null);

	const refreshFill = useCallback(() => {
		const fill = fillRef.current;
		const sEl = startRef.current;
		const eEl = endRef.current;
		if (!fill || !sEl || !eEl) return;
		const sV = Number(sEl.value);
		const eV = Number(eEl.value);
		const range = max - min;
		const leftPct = ((sV - min) / range) * 100;
		const widthPct = ((eV - sV) / range) * 100;
		fill.style.left = `${leftPct}%`;
		fill.style.width = `${widthPct}%`;
	}, [max, min]);

	useEffect(() => {
		if (startRef.current) {
			startRef.current.value = String(startValue);
			startRef.current.setAttribute("value", String(startValue));
		}
		if (endRef.current) {
			endRef.current.value = String(endValue);
			endRef.current.setAttribute("value", String(endValue));
		}
		refreshFill();
	}, [startValue, endValue, refreshFill]);

	const handleStartInput = () => {
		const sEl = startRef.current;
		const eEl = endRef.current;
		if (!sEl || !eEl) return;
		let sV = Number(sEl.value);
		const eV = Number(eEl.value);
		if (sV > eV - minGap) sV = eV - minGap;
		if (sV < min) sV = min;
		sEl.value = String(sV);
		sEl.setAttribute("value", String(sV));
		refreshFill();
		onChange(sV, eV);
	};

	const handleEndInput = () => {
		const sEl = startRef.current;
		const eEl = endRef.current;
		if (!sEl || !eEl) return;
		let eV = Number(eEl.value);
		const sV = Number(sEl.value);
		if (eV < sV + minGap) eV = sV + minGap;
		if (eV > max) eV = max;
		eEl.value = String(eV);
		eEl.setAttribute("value", String(eV));
		refreshFill();
		onChange(sV, eV);
	};

	return (
		<div className="dual-range">
			<div className="track" />
			<div className="fill" ref={fillRef} />
			<input
				ref={startRef}
				type="range"
				min={min}
				max={max}
				step={step}
				defaultValue={startValue}
				onInput={handleStartInput}
				aria-label={startAriaLabel}
				disabled={disabled}
			/>
			<input
				ref={endRef}
				type="range"
				min={min}
				max={max}
				step={step}
				defaultValue={endValue}
				onInput={handleEndInput}
				aria-label={endAriaLabel}
				disabled={disabled}
			/>
		</div>
	);
}
