import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";
import satori, { type SatoriOptions } from "satori";
import { LandingOgTemplate, OG_HEIGHT, OG_WIDTH } from "./og/landingTemplate";

type OgFont = SatoriOptions["fonts"][number];

const require = createRequire(import.meta.url);

function loadFont(
	pkgFile: string,
	name: string,
	weight: NonNullable<OgFont["weight"]>,
	style: NonNullable<OgFont["style"]>,
): OgFont {
	return {
		name,
		weight,
		style,
		data: readFileSync(require.resolve(pkgFile)),
	};
}

const fonts: OgFont[] = [
	loadFont("@fontsource/inter/files/inter-latin-900-normal.woff", "Inter", 900, "normal"),
	loadFont("@fontsource/inter/files/inter-latin-600-normal.woff", "Inter", 600, "normal"),
	loadFont(
		"@fontsource/bodoni-moda/files/bodoni-moda-latin-700-italic.woff",
		"Bodoni Moda",
		700,
		"italic",
	),
];

const OUT = fileURLToPath(new URL("../public/og/landing.png", import.meta.url));

const AVATAR_PATH = fileURLToPath(new URL("../public/alper-avatar-192.png", import.meta.url));
const avatarSrc = `data:image/png;base64,${readFileSync(AVATAR_PATH).toString("base64")}`;

async function main() {
	const svg = await satori(LandingOgTemplate({ avatarSrc }), {
		width: OG_WIDTH,
		height: OG_HEIGHT,
		fonts,
	});
	const png = new Resvg(svg).render().asPng();
	writeFileSync(OUT, png);
	console.log(`${OUT} (${png.byteLength} bytes)`);
}

await main();
