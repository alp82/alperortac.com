import type { ReactElement } from "react";
import { OG_HEADLINE, OG_TAGLINE } from "#/data/hero";
import { SKY_NOON } from "#/data/skyCurve";

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

const SERIF_WORD = "passion";

// PixelCloud's SVG path from PixelBackground.tsx:125-128 decomposed into its
// four rects, as [x, y, w, h] in the original 100x60 viewBox units:
// M20 30h10v10H20z / M30 20h40v10H30z / M70 30h10v10H70z / M10 40h80v10H10z
const CLOUD_RECTS = [
	[20, 30, 10, 10],
	[30, 20, 40, 10],
	[70, 30, 10, 10],
	[10, 40, 80, 10],
] as const;

// One hero pixel-cloud as absolutely-positioned white rects. The hero renders
// the 100x60 viewBox at 120px width, so each unit is u = 1.2 * scale. The hero
// scales around the cloud's center via CSS transform; placing the scaled cloud
// at its (x, y) top-left instead drops that center-origin adjustment (~12px —
// negligible for a static card). scrollPos = 0 (scroll-top framing).
function OgPixelCloud({
	x,
	y,
	scale,
}: {
	x: number;
	y: number;
	scale: number;
}): ReactElement {
	const u = 1.2 * scale;
	return (
		<div
			style={{
				position: "absolute",
				left: x,
				top: y,
				width: 120 * scale,
				height: 72 * scale,
				opacity: 0.4,
				display: "flex",
			}}
		>
			{CLOUD_RECTS.map(([rx, ry, rw, rh]) => (
				<div
					key={`${rx}-${ry}`}
					style={{
						position: "absolute",
						left: rx * u,
						top: ry * u,
						width: rw * u,
						height: rh * u,
						backgroundColor: "white",
					}}
				/>
			))}
		</div>
	);
}

// Pure, zero-IO satori template for the landing OG card. Copy comes from the
// hero data constants; the background is the hero's scroll-top sky (SKY_NOON);
// the "passion" accent mirrors HeroSubtitle's sunset micro-ramp. The caller
// supplies the avatar as a data URI so the template itself stays IO-free.
export function LandingOgTemplate({
	avatarSrc,
}: {
	avatarSrc: string;
}): ReactElement {
	const [beforeWord, afterWord] = OG_TAGLINE.split(SERIF_WORD);
	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				width: "100%",
				height: "100%",
				padding: 80,
				backgroundColor: `rgb(${SKY_NOON.r}, ${SKY_NOON.g}, ${SKY_NOON.b})`,
			}}
		>
			{/* Sun: PixelBackground's scroll-top sun sits at DEFAULT_CELESTIAL.sun
			    (75%, 12%) of the canvas — center (900, 76) on 1200x630 — so the
			    96px disc's top-left lands at (852, 28). Size and colors mirror
			    w-24 h-24 bg-yellow-200 border-4 border-yellow-300 + glow shadow. */}
			<div
				style={{
					position: "absolute",
					left: 852,
					top: 28,
					width: 96,
					height: 96,
					borderRadius: 48,
					backgroundColor: "#fef08a",
					border: "4px solid #fde047",
					boxShadow: "0 0 40px rgba(253,224,71,0.5)",
				}}
			/>
			{/* The two outer clouds from src/components/PixelBackground.tsx at
			    scrollPos 0. The hero's middle cloud (600, 100, 0.8) is dropped: on
			    the OG canvas it hides behind the avatar. The right cloud's y is
			    deliberately lifted from the hero's 250 to 170 for clearance above
			    the enlarged headline below — not hero-faithful on purpose. */}
			<OgPixelCloud x={100} y={150} scale={1.2} />
			<OgPixelCloud x={1000} y={170} scale={1} />
			{/* Avatar: HeroSection.tsx:10-14 portrait (w-32 rounded-full border-4
			    border-slate-900 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] object-cover)
			    scaled up to 160px for the OG canvas. */}
			<img
				src={avatarSrc}
				style={{
					width: 160,
					height: 160,
					borderRadius: 80,
					border: "5px solid #0f172a",
					boxShadow: "6px 6px 0 rgba(0,0,0,1)",
					objectFit: "cover",
					marginBottom: 40,
				}}
			/>
			<div
				style={{
					fontFamily: "Inter",
					fontWeight: 900,
					fontSize: 120,
					color: "#0f172a",
					letterSpacing: "-0.04em",
				}}
			>
				{OG_HEADLINE}
			</div>
			<div
				style={{
					display: "flex",
					alignItems: "baseline",
					marginTop: 48,
					fontFamily: "Inter",
					fontWeight: 600,
					fontSize: 48,
					lineHeight: 1,
					color: "#0a0a0a",
				}}
			>
				<span style={{ whiteSpace: "pre" }}>{beforeWord}</span>
				<span
					style={{
						fontFamily: "Bodoni Moda",
						fontStyle: "italic",
						fontWeight: 700,
						fontSize: 64,
						// Bodoni at 64px renders ~2px above the Inter 48px baseline
						// in satori's baseline row; nudge down to match.
						position: "relative",
						top: 2,
						backgroundImage: "linear-gradient(100deg,#D9530E,#C2410C,#A8380A)",
						backgroundClip: "text",
						color: "transparent",
					}}
				>
					{SERIF_WORD}
				</span>
				<span style={{ whiteSpace: "pre" }}>{afterWord}</span>
			</div>
		</div>
	);
}
