import { useEffect, useState } from "react";
import {
	driftOffset,
	letterSizePx,
	revealFactor,
	WM,
	WORDS,
	zoneOpacity,
} from "./narrativeWatermark";

// Vertical stacked watermark words (BUILD / EXPLORE) that crossfade and drift
// behind the page as the user scrolls. The geometry lives in the pure
// `./narrativeWatermark` module; this is a thin render layer. It consumes the
// existing `scrollProgress` prop like its siblings (PixelBackground / Minimap).
// Color is per-word data (no isNight flip): each word carries its own fixed
// color.
export function NarrativeWatermark({
	scrollProgress,
	scrollY,
	override,
	isNight = false,
}: {
	scrollProgress: number;
	scrollY: number;
	override?: readonly string[] | undefined;
	isNight?: boolean;
}) {
	// Deterministic SSR + first-paint defaults so server and client render the
	// same layout (no hydration mismatch); the effect swaps in the real window
	// metrics after mount.
	const [dims, setDims] = useState({ w: 1280, h: 800 });
	const [reduceMotion, setReduceMotion] = useState(false);

	useEffect(() => {
		const readDims = () =>
			setDims({ w: window.innerWidth, h: window.innerHeight });
		readDims();
		window.addEventListener("resize", readDims);

		const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
		const readMotion = () => setReduceMotion(mq.matches);
		readMotion();
		mq.addEventListener("change", readMotion);

		return () => {
			window.removeEventListener("resize", readDims);
			mq.removeEventListener("change", readMotion);
		};
		// scrollProgress can go briefly stale on a resize-without-scroll - the same
		// benign tradeoff _layout.tsx already accepts for the sky; it self-corrects
		// on the next scroll tick.
	}, []);

	const travelPx = reduceMotion ? 0 : (WM.travelVh / 100) * dims.h;
	const isMobile = dims.w <= WM.mobileMaxWidthPx;
	// On mobile only the first word renders, at a knocked-down opacity, so the
	// watermark never crowds the narrower column.
	const words = isMobile ? WORDS.slice(0, 1) : WORDS;
	// Compute once per render: letter size doesn't depend on the word, only on
	// viewport dimensions.
	const fontPx = letterSizePx(dims.h, dims.w);
	const scrolledVh = dims.h > 0 ? scrollY / dims.h : 0;

	// While a subpage is open, render its two words STATICALLY in place of
	// BUILD / EXPLORE: left edge + dark color from WORDS[0], right edge + light
	// from WORDS[1]. The left word is always anchored toward the TOP and the
	// right toward the BOTTOM (length-independent, so the pair never drifts off
	// between subpages), at the steady WM.opacity. Each word div is keyed by edge
	// index (0/1) so the text swaps in place across subpages without a remount,
	// and the per-word `transition: opacity 0.25s ease` fades the swap.
	if (override) {
		return (
			<div
				className="fixed inset-y-0 left-0 right-0 md:right-20 -z-1 pointer-events-none overflow-hidden"
				aria-hidden="true"
			>
				{override.slice(0, WORDS.length).map((text, i) => {
					const word = WORDS[i];
					if (!word) return null;
					const len = text.length;
					const wordH = len * fontPx * WM.lineHeight;
					const padTopPx = (WM.padTopVh / 100) * dims.h;
					const padBottomPx = (WM.padBottomVh / 100) * dims.h;
					// Left word toward the TOP, right toward the BOTTOM - always.
					const ty =
						word.zone.edge === "left"
							? padTopPx
							: Math.max(dims.h - wordH - padBottomPx, padTopPx);
					const edgeStyle =
						word.zone.edge === "left"
							? { left: `${WM.insetVw}vw` }
							: { right: `${WM.insetVw}vw` };

					return (
						<div
							key={word.zone.edge}
							style={{
								position: "absolute",
								top: 0,
								...edgeStyle,
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
								fontWeight: 900,
								textTransform: "uppercase",
								letterSpacing: "-0.04em",
								lineHeight: WM.lineHeight,
								fontSize: `${fontPx}px`,
								// Subpage words must contrast the frozen sky, not BUILD/EXPLORE's
								// fixed dark/light: light over a night sky, dark over day -
								// otherwise the dark left word vanishes on a night subpage.
								color: isNight ? "#f8fafc" : "#0f172a",
								opacity: WM.opacity,
								transform: `translate3d(0, ${ty}px, 0)`,
								userSelect: "none",
								willChange: "transform",
								transition: "opacity 0.25s ease",
							}}
						>
							{text.split("").map((ch, ci) => (
								// biome-ignore lint/suspicious/noArrayIndexKey: static letter list, never reordered - the index is the stable identity (a word can repeat a letter)
								<span key={ci} className="block">
									{ch}
								</span>
							))}
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
			{words.map((word) => {
				const len = word.text.length;
				const wordH = len * fontPx * WM.lineHeight;
				const ty = driftOffset(
					scrollProgress,
					word.zone,
					dims.h,
					wordH,
					travelPx,
				);
				const op =
					zoneOpacity(scrollProgress, word.zone) *
					(isMobile ? WM.mobileOpacityScale : 1) *
					revealFactor(scrolledVh, word.revealAfterVh);
				const edgeStyle =
					word.zone.edge === "left"
						? { left: `${WM.insetVw}vw` }
						: { right: `${WM.insetVw}vw` };

				return (
					<div
						key={word.text}
						style={{
							position: "absolute",
							top: 0,
							// No explicit width: the column shrinks to its widest glyph so the
							// inset anchors the actual edge. Adding a width would shift every
							// word - do not "fix" it.
							...edgeStyle,
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							fontWeight: 900,
							textTransform: "uppercase",
							letterSpacing: "-0.04em",
							lineHeight: WM.lineHeight,
							fontSize: `${fontPx}px`,
							color: word.color,
							opacity: op,
							transform: `translate3d(0, ${ty}px, 0)`,
							userSelect: "none",
							willChange: "transform",
							transition: "opacity 0.25s ease",
						}}
					>
						{word.text.split("").map((ch, i) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: static letter list, never reordered - the index is the stable identity (a word can repeat a letter, e.g. the two L's)
							<span key={i} className="block">
								{ch}
							</span>
						))}
					</div>
				);
			})}
		</div>
	);
}
