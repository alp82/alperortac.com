import { writeFileSync } from "node:fs";
import process from "node:process";
import { fileURLToPath } from "node:url";
import {
	fetchFeedXml,
	parseShortsFeed,
	renderShortsModule,
} from "./shortsFeed";

const FEED_URL =
	"https://www.youtube.com/feeds/videos.xml?channel_id=UCNo1thPweKiBs9-gcpvrJhQ";
const MAX_SHORTS = 10;
const OUT = fileURLToPath(
	new URL("../src/data/youtubeShorts.ts", import.meta.url),
);

async function main() {
	const xml = await fetchFeedXml(fetch, FEED_URL);
	const shorts = parseShortsFeed(xml);
	if (shorts.length === 0) {
		console.error(
			"Shorts feed yielded zero valid entries; refusing to write stale data.",
		);
		process.exit(1);
	}
	const latest = shorts.slice(0, MAX_SHORTS);
	writeFileSync(OUT, renderShortsModule(latest));
	console.log(`${OUT} (${latest.length} shorts)`);
}

await main();
