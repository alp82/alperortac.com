import { memo, useEffect, useState } from "react";
import type { Journey } from "./_layout/scrollJourney/useScrollJourney";
import { useJourneyRepaint } from "./_layout/scrollJourney/useScrollJourney";
import { letterSizePx, WM, WORDS } from "./narrativeWatermark";

// Vertical stacked watermark words (BUILD / EXPLORE) that crossfade and drift
// behind the page as the user scrolls. The geometry lives in the pure
// `./narrativeWatermark` module; this is a thin render layer.
//
// The drift and crossfade are written directly by the scroll driver (see
// journeyTargets.ts), so this component does not re-render on scroll. Color is
// per-word data (no isNight flip): each word carries its own fixed color.
//
// The subpage override below is static - two words held in place while a detail
// panel is open - so it stays plain React with no driver involvement.

const SHARED: React.CSSProperties = {
	position: "absolute",
	top: 0,
	display: "flex",
	flexDirection: "column",
	alignItems: "center",
	fontWeight: 900,
	textTransform: "uppercase",
	letterSpacing: "-0.04em",
	lineHeight: WM.lineHeight,
	userSelect: "none",
};

function Letters({ text }: { text: string }) {
	return (
		<>
			{text.split("").map((ch, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: static letter list, never reordered - the index is the stable identity (a word can repeat a letter, e.g. the two L's)
				<span key={i} className="block">
					{ch}
				</span>
			))}
		</>
	);
}

function NarrativeWatermarkInner({
	override,
	isNight = false,
	journey,
}: {
	override?: readonly string[] | undefined;
	isNight?: boolean;
	journey?: Journey | undefined;
}) {
	useJourneyRepaint(journey);

	// Only the static override branch needs viewport metrics at render time; the
	// scrolling branch gets its font size and offsets from the driver.
	const [dims, setDims] = useState({ w: 1280, h: 800 });
	useEffect(() => {
		const readDims = () =>
			setDims({ w: window.innerWidth, h: window.innerHeight });
		readDims();
		window.addEventListener("resize", readDims);
		return () => window.removeEventListener("resize", readDims);
	}, []);

	// While a detail subpage is open, render its two words STATICALLY in place of
	// BUILD / EXPLORE: left edge + dark color from WORDS[0], right edge + light
	// from WORDS[1]. The left word is always anchored toward the TOP and the
	// right toward the BOTTOM (length-independent, so the pair never drifts off
	// between subpages), at the steady WM.opacity. Each word div is keyed by edge
	// index (0/1) so the text swaps in place across subpages without a remount,
	// and the per-word `transition: opacity 0.25s ease` fades the swap.
	if (override) {
		const fontPx = letterSizePx(dims.h, dims.w);
		return (
			<div
				className="fixed inset-y-0 left-0 right-0 md:right-20 -z-1 pointer-events-none overflow-hidden"
				aria-hidden="true"
			>
				{override.slice(0, WORDS.length).map((text, i) => {
					const word = WORDS[i];
					if (!word) return null;
					const wordH = text.length * fontPx * WM.lineHeight;
					const padTopPx = (WM.padTopVh / 100) * dims.h;
					const padBottomPx = (WM.padBottomVh / 100) * dims.h;
					// Left word toward the TOP, right toward the BOTTOM - always.
					const ty =
						word.zone.edge === "left"
							? padTopPx
							: Math.max(dims.h - wordH - padBottomPx, padTopPx);

					return (
						<div
							key={word.zone.edge}
							style={{
								...SHARED,
								...(word.zone.edge === "left"
									? { left: `${WM.insetVw}vw` }
									: { right: `${WM.insetVw}vw` }),
								fontSize: `${fontPx}px`,
								// Subpage words must contrast the frozen sky, not BUILD/EXPLORE's
								// fixed dark/light: light over a night sky, dark over day -
								// otherwise the dark left word vanishes on a night subpage.
								color: isNight ? "#f8fafc" : "#0f172a",
								opacity: WM.opacity,
								transform: `translate3d(0, ${ty}px, 0)`,
								willChange: "transform",
								transition: "opacity 0.25s ease",
							}}
						>
							<Letters text={text} />
						</div>
					);
				})}
			</div>
		);
	}

	return (
		<div
			className="fixed inset-y-0 left-0 right-0 md:right-20 -z-1 pointer-events-none overflow-hidden"
			aria-hidden="true"
		>
			{WORDS.map((word, i) => (
				<div
					key={word.text}
					ref={(el) => {
						if (journey) journey.targets.words[i] = el;
					}}
					style={{
						...SHARED,
						// No explicit width: the column shrinks to its widest glyph so the
						// inset anchors the actual edge. Adding a width would shift every
						// word - do not "fix" it.
						...(word.zone.edge === "left"
							? { left: `${WM.insetVw}vw` }
							: { right: `${WM.insetVw}vw` }),
						fontSize: `${letterSizePx(dims.h, dims.w)}px`,
						color: word.color,
						// Seeded hidden; the driver owns transform + opacity from the first
						// frame after hydration.
						opacity: 0,
						willChange: "transform, opacity",
					}}
				>
					<Letters text={word.text} />
				</div>
			))}
		</div>
	);
}

export const NarrativeWatermark = memo(NarrativeWatermarkInner);
