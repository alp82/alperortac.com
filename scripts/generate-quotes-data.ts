import { writeFileSync } from "node:fs";
import process from "node:process";
import { fileURLToPath } from "node:url";
import {
	chartUrl,
	fetchQuoteJson,
	parseQuoteMeta,
	type QuoteSource,
	renderQuotesModule,
	type TapeQuote,
} from "./quotesFeed";

// The tape's roster, in tape order - Alper's actual lanes (ETFs, tech
// stocks, crypto). Display symbol = the real exchange ticker; EUNL is the
// iShares Core MSCI World ETF.
const SOURCES: QuoteSource[] = [
	{ sym: "VWCE", yahoo: "VWCE.DE" },
	{ sym: "AAPL", yahoo: "AAPL" },
	{ sym: "NVDA", yahoo: "NVDA" },
	{ sym: "BTC", yahoo: "BTC-USD" },
	{ sym: "MSFT", yahoo: "MSFT" },
	{ sym: "ETH", yahoo: "ETH-USD" },
	{ sym: "TSLA", yahoo: "TSLA" },
	{ sym: "EUNL", yahoo: "EUNL.DE" },
];

const OUT = fileURLToPath(new URL("../src/data/quotes.ts", import.meta.url));

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
	const quotes: TapeQuote[] = [];
	for (const source of SOURCES) {
		// Sequential with a small gap - 8 quick hits in a burst is what trips
		// Yahoo's rate limiter.
		if (quotes.length > 0) await delay(200);
		try {
			const json = await fetchQuoteJson(fetch, chartUrl(source));
			const quote = parseQuoteMeta(source.sym, json);
			if (quote) quotes.push(quote);
		} catch (error) {
			console.warn(
				`quotesFeed: skipping ${source.sym}: ${
					error instanceof Error ? error.message : String(error)
				}`,
			);
		}
	}
	if (quotes.length === 0) {
		console.error(
			"Quote feed yielded zero valid entries; refusing to write stale data.",
		);
		process.exit(1);
	}
	const asOf = new Date().toISOString().slice(0, 10);
	writeFileSync(OUT, renderQuotesModule(quotes, asOf));
	console.log(`${OUT} (${quotes.length} quotes, as of ${asOf})`);
}

await main();
