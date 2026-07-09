import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	decodeXmlEntities,
	fetchFeedXml,
	parseShortsFeed,
	renderShortsModule,
	type ShortEntry,
} from "../shortsFeed";

// ---------------------------------------------------------------------------
// Unit tests for the pure, build-time-only Shorts RSS parser/renderer
// (scripts/shortsFeed.ts). No network, no filesystem — fixtures are inline
// XML strings shaped like a real YouTube channel RSS feed.
// ---------------------------------------------------------------------------

describe("decodeXmlEntities", () => {
	it("decodes the 5 predefined XML entities", () => {
		expect(decodeXmlEntities("&amp;")).toBe("&");
		expect(decodeXmlEntities("&lt;")).toBe("<");
		expect(decodeXmlEntities("&gt;")).toBe(">");
		expect(decodeXmlEntities("&quot;")).toBe('"');
		expect(decodeXmlEntities("&apos;")).toBe("'");
	});

	it("decodes numeric character references &#39; and &#x27; to an apostrophe", () => {
		expect(decodeXmlEntities("&#39;")).toBe("'");
		expect(decodeXmlEntities("&#x27;")).toBe("'");
	});

	it("decodes in a single non-recursive pass: &amp;amp; -> &amp;", () => {
		expect(decodeXmlEntities("&amp;amp;")).toBe("&amp;");
	});

	it("single pass on a triple-encoded ampersand: &amp;amp;amp; -> &amp;amp;", () => {
		expect(decodeXmlEntities("&amp;amp;amp;")).toBe("&amp;amp;");
	});
});

// Two well-formed entries, feed order OLDEST-first (i.e. NOT already sorted
// desc by publishedAt) preceded by a realistic channel-level preamble
// (channel <title> before the first <entry>) — parsing chunk 0 as an entry
// would throw or emit a bogus record, which this fixture is built to catch.
const TWO_ENTRY_FEED = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015" xmlns:media="http://search.yahoo.com/mrss/" xmlns="http://www.w3.org/2005/Atom">
  <link rel="self" href="https://www.youtube.com/feeds/videos.xml?channel_id=UCabc123"/>
  <id>yt:channel:UCabc123</id>
  <yt:channelId>UCabc123</yt:channelId>
  <title>Alper Ortac</title>
  <link rel="alternate" href="https://www.youtube.com/channel/UCabc123"/>
  <author>
    <name>Alper Ortac</name>
    <uri>https://www.youtube.com/channel/UCabc123</uri>
  </author>
  <entry>
    <id>yt:video:EARLIER0001</id>
    <yt:videoId>EARLIER0001</yt:videoId>
    <yt:channelId>UCabc123</yt:channelId>
    <title>Alper&#39;s Tips &amp; Tricks</title>
    <link rel="alternate" href="https://www.youtube.com/watch?v=EARLIER0001"/>
    <author>
      <name>Alper Ortac</name>
    </author>
    <published>2024-01-01T10:00:00+00:00</published>
    <updated>2024-01-02T10:00:00+00:00</updated>
    <media:group>
      <media:title>Alper&#39;s Tips &amp; Tricks</media:title>
      <media:content url="https://www.youtube.com/v/EARLIER0001" type="application/x-shockwave-flash" width="640" height="360"/>
      <media:community>
        <media:starRating count="10" average="5.00" min="1" max="5"/>
        <media:statistics views="500"/>
      </media:community>
    </media:group>
  </entry>
  <entry>
    <id>yt:video:LATER00002</id>
    <yt:videoId>LATER00002</yt:videoId>
    <yt:channelId>UCabc123</yt:channelId>
    <title>He said "hi" \\ ok</title>
    <link rel="alternate" href="https://www.youtube.com/watch?v=LATER00002"/>
    <author>
      <name>Alper Ortac</name>
    </author>
    <published>2024-03-01T10:00:00+00:00</published>
    <updated>2024-03-02T10:00:00+00:00</updated>
    <media:group>
      <media:title>He said "hi" \\ ok</media:title>
      <media:content url="https://www.youtube.com/v/LATER00002" type="application/x-shockwave-flash" width="640" height="360"/>
      <media:community>
        <media:starRating count="10" average="5.00" min="1" max="5"/>
        <media:statistics views="1500"/>
      </media:community>
    </media:group>
  </entry>
</feed>`;

describe("parseShortsFeed — well-formed feed", () => {
	it("returns both entries sorted by publishedAt descending", () => {
		const result = parseShortsFeed(TWO_ENTRY_FEED);
		expect(result.length).toBe(2);
		expect(result[0]?.id).toBe("LATER00002");
		expect(result[1]?.id).toBe("EARLIER0001");
	});

	it("uses the verbatim <yt:videoId> for id", () => {
		const result = parseShortsFeed(TWO_ENTRY_FEED);
		expect(result.map((s) => s.id)).toEqual(["LATER00002", "EARLIER0001"]);
	});

	it("entity-decodes the title (&#39; and &amp;)", () => {
		const result = parseShortsFeed(TWO_ENTRY_FEED);
		const earlier = result.find((s) => s.id === "EARLIER0001");
		expect(earlier?.title).toBe("Alper's Tips & Tricks");
	});

	it("preserves a quote-and-backslash title verbatim (no XML entity to decode)", () => {
		const result = parseShortsFeed(TWO_ENTRY_FEED);
		const later = result.find((s) => s.id === "LATER00002");
		expect(later?.title).toBe('He said "hi" \\ ok');
	});

	it("keeps publishedAt verbatim from <published>", () => {
		const result = parseShortsFeed(TWO_ENTRY_FEED);
		const later = result.find((s) => s.id === "LATER00002");
		expect(later?.publishedAt).toBe("2024-03-01T10:00:00+00:00");
	});

	it("parses views as a number, not a string", () => {
		const result = parseShortsFeed(TWO_ENTRY_FEED);
		const later = result.find((s) => s.id === "LATER00002");
		const earlier = result.find((s) => s.id === "EARLIER0001");
		expect(typeof later?.views).toBe("number");
		expect(later?.views).toBe(1500);
		expect(typeof earlier?.views).toBe("number");
		expect(earlier?.views).toBe(500);
	});
});

const ONE_GOOD_ONE_MISSING_STATS_FEED = `<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015" xmlns:media="http://search.yahoo.com/mrss/">
  <title>Alper Ortac</title>
  <entry>
    <yt:videoId>GOODVIDEO01</yt:videoId>
    <title>Good Video</title>
    <published>2024-05-01T00:00:00+00:00</published>
    <media:group>
      <media:community>
        <media:statistics views="42"/>
      </media:community>
    </media:group>
  </entry>
  <entry>
    <yt:videoId>BADVIDEO002</yt:videoId>
    <title>Missing Stats Video</title>
    <published>2024-05-02T00:00:00+00:00</published>
    <media:group>
      <media:community>
      </media:community>
    </media:group>
  </entry>
</feed>`;

const ALL_MALFORMED_FEED = `<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015" xmlns:media="http://search.yahoo.com/mrss/">
  <title>Alper Ortac</title>
  <entry>
    <title>No video id at all</title>
    <published>2024-01-01T00:00:00+00:00</published>
    <media:group>
      <media:community>
        <media:statistics views="7"/>
      </media:community>
    </media:group>
  </entry>
  <entry>
    <yt:videoId>ONLYID00001</yt:videoId>
  </entry>
</feed>`;

const ZERO_ENTRY_FEED = `<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015">
  <title>Alper Ortac</title>
  <link rel="self" href="https://www.youtube.com/feeds/videos.xml?channel_id=UCabc123"/>
</feed>`;

describe("parseShortsFeed — malformed entries are skipped, not thrown", () => {
	let warnSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
	});

	afterEach(() => {
		warnSpy.mockRestore();
	});

	it("skips an entry missing media:statistics and warns naming its index + field", () => {
		const result = parseShortsFeed(ONE_GOOD_ONE_MISSING_STATS_FEED);
		expect(result.length).toBe(1);
		expect(result[0]?.id).toBe("GOODVIDEO01");
		expect(warnSpy).toHaveBeenCalled();
		const message = warnSpy.mock.calls
			.map((call: unknown[]) => call.join(" "))
			.join("\n");
		expect(message).toMatch(/1/);
		expect(message).toMatch(/views|media:statistics|statistics/i);
	});

	it("returns [] when every entry is malformed", () => {
		const result = parseShortsFeed(ALL_MALFORMED_FEED);
		expect(result).toEqual([]);
	});

	it("returns [] for a well-formed feed with zero entries (no throw)", () => {
		expect(() => parseShortsFeed(ZERO_ENTRY_FEED)).not.toThrow();
		expect(parseShortsFeed(ZERO_ENTRY_FEED)).toEqual([]);
	});
});

describe("fetchFeedXml — retry with linear backoff, fail loud after attempts", () => {
	const URL = "https://example.test/feed.xml";

	it("returns the body after two non-ok responses followed by a success", async () => {
		const fetchImpl = vi
			.fn()
			.mockResolvedValueOnce({ ok: false, status: 500, statusText: "ISE" })
			.mockResolvedValueOnce({ ok: false, status: 404, statusText: "NF" })
			.mockResolvedValueOnce({ ok: true, text: async () => "<feed/>" });
		const xml = await fetchFeedXml(fetchImpl as unknown as typeof fetch, URL, {
			delayMs: 1,
		});
		expect(xml).toBe("<feed/>");
		expect(fetchImpl).toHaveBeenCalledTimes(3);
	});

	it("throws after exhausting all attempts, calling fetchImpl exactly attempts times", async () => {
		const fetchImpl = vi
			.fn()
			.mockResolvedValue({ ok: false, status: 500, statusText: "ISE" });
		await expect(
			fetchFeedXml(fetchImpl as unknown as typeof fetch, URL, {
				attempts: 3,
				delayMs: 1,
			}),
		).rejects.toThrow(/3 attempts/);
		expect(fetchImpl).toHaveBeenCalledTimes(3);
	});

	it("retries on thrown errors too and surfaces the last failure message", async () => {
		const fetchImpl = vi.fn().mockRejectedValue(new Error("socket hang up"));
		await expect(
			fetchFeedXml(fetchImpl as unknown as typeof fetch, URL, {
				attempts: 2,
				delayMs: 1,
			}),
		).rejects.toThrow(/socket hang up/);
		expect(fetchImpl).toHaveBeenCalledTimes(2);
	});
});

describe("renderShortsModule", () => {
	const sampleShorts: ShortEntry[] = [
		{
			id: "AbCdEfGhIjK",
			title: "Magical CLI Tools - Part 1",
			views: 1000,
			publishedAt: "2024-06-01T00:00:00+00:00",
		},
	];

	it("emits an AUTO-GENERATED header, export const, and export interface", () => {
		const output = renderShortsModule(sampleShorts);
		expect(output).toMatch(/AUTO-GENERATED/i);
		expect(output).toContain("export const YOUTUBE_SHORTS");
		expect(output).toContain("export interface YoutubeShort");
	});

	it("escapes quotes and backslashes via JSON.stringify so the module stays valid TypeScript", () => {
		const trickyShort: ShortEntry = {
			id: "TrIcKyId001",
			title: 'He said "hi" \\ ok',
			views: 10,
			publishedAt: "2024-01-01T00:00:00+00:00",
		};
		const output = renderShortsModule([trickyShort]);
		const expectedLiteral = JSON.stringify(trickyShort.title);
		expect(output).toContain(expectedLiteral);
		expect(JSON.parse(expectedLiteral)).toBe(trickyShort.title);
	});

	it("renderShortsModule([]) emits a syntactically valid empty-array module", () => {
		const output = renderShortsModule([]);
		expect(output).toMatch(/AUTO-GENERATED/i);
		expect(output).toContain("export const YOUTUBE_SHORTS");
		expect(output).toContain("export interface YoutubeShort");
		const afterDeclaration = output.slice(output.indexOf("YOUTUBE_SHORTS"));
		expect(afterDeclaration).toMatch(/\[\s*\]/);
		expect(afterDeclaration).not.toMatch(/id\s*:/);
	});
});
