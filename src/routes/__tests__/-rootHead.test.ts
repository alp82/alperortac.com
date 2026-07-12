import { describe, expect, it } from "vitest";
import { SOCIAL_LINKS } from "../../components/_layout/social/socialLinks";
import { CONTACT_EMAIL } from "../../data/footer";
import { HERO_SUMMARY, OG_HEADLINE, OG_TAGLINE } from "../../data/hero";
import { Route } from "../__root";

// ---------------------------------------------------------------------------
// Data-contract tests for the root route head() (SEO/OG/Twitter/JSON-LD).
// Values are asserted against the imported data constants (HERO_SUMMARY,
// CONTACT_EMAIL, SOCIAL_LINKS) - never hardcoded copy - so editing the data
// files updates the tags without requiring a test edit (shape, not content).
// ---------------------------------------------------------------------------

type Tag = Record<string, string | undefined>;

type RootHead = NonNullable<typeof Route.options.head>;

function getHead(pathname: string) {
	// head() is synchronous here; unwrap the Awaitable<> in its return type.
	const head = Route.options.head?.({
		matches: [{ pathname }],
	} as unknown as Parameters<RootHead>[0]) as Awaited<ReturnType<RootHead>>;
	return {
		meta: (head?.meta ?? []) as Tag[],
		links: (head?.links ?? []) as Tag[],
		scripts: (head?.scripts ?? []) as Tag[],
	};
}

function metaBy(
	meta: Tag[],
	key: "name" | "property",
	value: string,
): Tag | undefined {
	return meta.find((m) => m[key] === value);
}

describe("root head contract", () => {
	it("keeps the existing charSet, viewport, and title entries", () => {
		const { meta } = getHead("/");
		expect(meta.find((m) => m.charSet === "utf-8")).toBeTruthy();
		const viewport = metaBy(meta, "name", "viewport");
		expect(viewport?.content).toContain("width=device-width");
		expect(meta.find((m) => typeof m.title === "string")).toBeTruthy();
	});

	it("description meta equals the hero summary verbatim", () => {
		const { meta } = getHead("/");
		expect(metaBy(meta, "name", "description")?.content).toBe(
			HERO_SUMMARY.join(" "),
		);
	});

	it("robots meta allows large image previews", () => {
		const { meta } = getHead("/");
		expect(metaBy(meta, "name", "robots")?.content).toContain(
			"max-image-preview:large",
		);
	});

	it("emits the full Open Graph set for landing.png", () => {
		const { meta } = getHead("/");
		expect(metaBy(meta, "property", "og:type")?.content).toBe("website");
		expect(metaBy(meta, "property", "og:site_name")?.content).toBeTruthy();
		expect(metaBy(meta, "property", "og:locale")?.content).toBeTruthy();
		expect(metaBy(meta, "property", "og:title")?.content).toBeTruthy();
		expect(metaBy(meta, "property", "og:description")?.content).toBe(
			HERO_SUMMARY.join(" "),
		);
		const image = metaBy(meta, "property", "og:image")?.content;
		expect(image).toBe("https://alperortac.com/og/landing.png");
		expect(image?.startsWith("https://")).toBe(true);
		expect(metaBy(meta, "property", "og:image:type")?.content).toBe(
			"image/png",
		);
		expect(metaBy(meta, "property", "og:image:width")?.content).toBe("1200");
		expect(metaBy(meta, "property", "og:image:height")?.content).toBe("630");
		const alt = metaBy(meta, "property", "og:image:alt")?.content;
		expect(alt).toBe(`${OG_HEADLINE} ${OG_TAGLINE}`);
	});

	it("emits a summary_large_image Twitter card mirroring the og image", () => {
		const { meta } = getHead("/");
		expect(metaBy(meta, "name", "twitter:card")?.content).toBe(
			"summary_large_image",
		);
		expect(metaBy(meta, "name", "twitter:site")?.content).toBeTruthy();
		expect(metaBy(meta, "name", "twitter:creator")?.content).toBeTruthy();
		expect(metaBy(meta, "name", "twitter:title")?.content).toBeTruthy();
		expect(metaBy(meta, "name", "twitter:description")?.content).toBe(
			HERO_SUMMARY.join(" "),
		);
		expect(metaBy(meta, "name", "twitter:image")?.content).toBe(
			metaBy(meta, "property", "og:image")?.content,
		);
		expect(metaBy(meta, "name", "twitter:image:alt")?.content).toBe(
			`${OG_HEADLINE} ${OG_TAGLINE}`,
		);
	});

	it("canonical link and og:url track the current pathname", () => {
		const home = getHead("/");
		const homeCanonical = home.links.find((l) => l.rel === "canonical");
		expect(homeCanonical?.href).toBe("https://alperortac.com/");
		expect(metaBy(home.meta, "property", "og:url")?.content).toBe(
			"https://alperortac.com/",
		);

		const career = getHead("/career");
		const careerCanonical = career.links.find((l) => l.rel === "canonical");
		expect(careerCanonical?.href).toBe("https://alperortac.com/career");
		expect(metaBy(career.meta, "property", "og:url")?.content).toBe(
			"https://alperortac.com/career",
		);
	});

	it("emits parseable JSON-LD with Person and WebSite nodes from the data", () => {
		const { scripts } = getHead("/");
		const jsonLd = scripts.find((s) => s.type === "application/ld+json");
		expect(jsonLd).toBeTruthy();
		expect(typeof jsonLd?.children).toBe("string");
		const parsed = JSON.parse(jsonLd?.children as string) as {
			"@graph": Array<Record<string, unknown>>;
		};
		const graph = parsed["@graph"];
		expect(Array.isArray(graph)).toBe(true);

		const person = graph.find((node) => node["@type"] === "Person");
		expect(person).toBeTruthy();
		expect(person?.email).toBe(`mailto:${CONTACT_EMAIL}`);
		const expectedSameAs = SOCIAL_LINKS.map((l) => l.href).filter(
			(h): h is string => Boolean(h),
		);
		expect(person?.sameAs).toEqual(expectedSameAs);

		const website = graph.find((node) => node["@type"] === "WebSite");
		expect(website).toBeTruthy();
	});
});
