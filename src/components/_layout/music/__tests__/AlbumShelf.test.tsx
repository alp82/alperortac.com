// @vitest-environment jsdom

/*
 * AlbumShelf snippet-player tests (music-snippet-player). Covers the new
 * in-grid YouTube moment player: click-to-load, full-row expansion, caption
 * bar, rotation-pause-while-open, single-player-at-a-time, next/prev closing
 * the open player, and the panel-close guard that unmounts the iframe when
 * the personal panel closes behind it (BLOCKER regression).
 *
 * Conventions mirror CoverWall.test.tsx (stubMatchMedia, fake timers,
 * flick-class counting; INTERVAL_MS 2800, out 200, in 340) and
 * PersonalPanel.test.tsx (role+name queries for the shelf's own transport
 * buttons). `visibleAlbums()` reads back the currently-rendered covers by
 * <img> src rather than assuming which 12 of the 17 ALBUMS entries the
 * rotation hook's mount-time shuffle picked.
 */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ALBUMS, type Album } from "../../../../data/personal";
import { SONG_MOMENTS } from "../../../../data/songMoments";
import { stubMatchMedia } from "../../../../test/stubMatchMedia";
import { AlbumShelf } from "../AlbumShelf";

const INTERVAL_MS = 2800;
const OUT_MS = 200;
const IN_MS = 340;

function flickCount(container: HTMLElement) {
	return (
		container.querySelectorAll(".album-flick-out").length +
		container.querySelectorAll(".album-flick-in").length
	);
}

function songByArtist() {
	return new Map(SONG_MOMENTS.map((s) => [s.artist, s]));
}

// The albums actually rendered right now, resolved from the visible <img>
// srcs back to their ALBUMS entry - safe regardless of which 12-of-17 subset
// the mount-time shuffle picked.
function visibleAlbums(container: HTMLElement): Album[] {
	return Array.from(container.querySelectorAll("img"))
		.map((img) => img.getAttribute("src"))
		.map((src) => ALBUMS.find((a) => a.cover === src))
		.filter((a): a is Album => Boolean(a));
}

function playName(song: { title: string; artist: string }) {
	return `Play the moment from ${song.title} by ${song.artist}`;
}

function closeName(song: { title: string }) {
	return `Close the player for ${song.title}`;
}

describe("AlbumShelf - in-grid song-moment player", () => {
	beforeEach(() => {
		stubMatchMedia(false);
	});

	afterEach(() => {
		cleanup();
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
		vi.useRealTimers();
	});

	// TC-AS-01
	it("renders no iframe anywhere before any interaction (click-to-load)", () => {
		const { container } = render(<AlbumShelf albums={ALBUMS} active={true} />);
		expect(container.querySelectorAll("iframe").length).toBe(0);
	});

	// TC-AS-02
	it("makes every cover with a song entry a named play button; covers without one render no button", () => {
		const { container } = render(<AlbumShelf albums={ALBUMS} active={true} />);
		const map = songByArtist();

		for (const album of visibleAlbums(container)) {
			const img = container.querySelector(`img[src="${album.cover}"]`);
			const cell = img?.closest("li");
			const button = cell?.querySelector("button") ?? null;
			const song = map.get(album.artist);

			if (song) {
				expect(
					button,
					`expected a play button for ${album.artist}`,
				).not.toBeNull();
				expect(button?.getAttribute("aria-label")).toBe(playName(song));
			} else {
				expect(
					button,
					`expected no button for song-less album ${album.artist}`,
				).toBeNull();
			}
		}
	});

	// TC-AS-03
	it("clicking a playable cover opens a full-row iframe with that song's start/end/autoplay", () => {
		const { container } = render(<AlbumShelf albums={ALBUMS} active={true} />);
		const map = songByArtist();
		const album = visibleAlbums(container).find((a) => map.has(a.artist));
		if (!album) throw new Error("no playable album rendered to test with");
		const song = map.get(album.artist);
		if (!song) throw new Error("unreachable");

		fireEvent.click(screen.getByRole("button", { name: playName(song) }));

		const playerRow = container.querySelector("li.col-span-full");
		expect(playerRow).not.toBeNull();
		const iframe = playerRow?.querySelector("iframe");
		expect(iframe).not.toBeNull();

		const src = iframe?.getAttribute("src") ?? "";
		expect(src).toContain(
			`https://www.youtube-nocookie.com/embed/${song.youtubeId}`,
		);
		expect(src).toContain(`start=${song.start}`);
		expect(src).toContain(`end=${song.end}`);
		expect(src).toContain("autoplay=1");
	});

	// TC-AS-04
	it("shows the song title, artist, and moment line in the caption bar", () => {
		const { container } = render(<AlbumShelf albums={ALBUMS} active={true} />);
		const map = songByArtist();
		const album = visibleAlbums(container).find((a) => map.has(a.artist));
		if (!album) throw new Error("no playable album rendered to test with");
		const song = map.get(album.artist);
		if (!song) throw new Error("unreachable");

		fireEvent.click(screen.getByRole("button", { name: playName(song) }));

		const playerRow = container.querySelector("li.col-span-full");
		expect(playerRow).not.toBeNull();
		expect(playerRow?.textContent).toContain(song.title);
		expect(playerRow?.textContent).toContain(song.artist);
		expect(playerRow?.textContent).toContain(song.moment);
	});

	// TC-AS-05
	it("pauses rotation while a player is open: zero flicks across several cadences, ring paused", () => {
		vi.useFakeTimers();
		const { container } = render(<AlbumShelf albums={ALBUMS} active={true} />);
		const map = songByArtist();
		const album = visibleAlbums(container).find((a) => map.has(a.artist));
		if (!album) throw new Error("no playable album rendered to test with");
		const song = map.get(album.artist);
		if (!song) throw new Error("unreachable");

		fireEvent.click(screen.getByRole("button", { name: playName(song) }));

		vi.advanceTimersByTime((INTERVAL_MS + OUT_MS + IN_MS) * 3);
		expect(flickCount(container)).toBe(0);

		const ring = container.querySelector(
			".album-ring-fill",
		) as SVGCircleElement;
		expect(ring.style.animationPlayState).toBe("paused");
	});

	// TC-AS-06
	it("closing the player removes the iframe, restores focus to the cover, and resumes rotation", () => {
		vi.useFakeTimers();
		const { container } = render(<AlbumShelf albums={ALBUMS} active={true} />);
		const map = songByArtist();
		const album = visibleAlbums(container).find((a) => map.has(a.artist));
		if (!album) throw new Error("no playable album rendered to test with");
		const song = map.get(album.artist);
		if (!song) throw new Error("unreachable");

		const coverButton = screen.getByRole("button", { name: playName(song) });
		fireEvent.click(coverButton);
		expect(container.querySelectorAll("iframe").length).toBe(1);

		fireEvent.click(screen.getByRole("button", { name: "Close player" }));

		expect(container.querySelectorAll("iframe").length).toBe(0);
		expect(document.activeElement).toBe(coverButton);

		vi.advanceTimersByTime(INTERVAL_MS);
		expect(container.querySelectorAll(".album-flick-out").length).toBe(1);
	});

	// TC-AS-07
	it("re-clicking the open cover also closes it (aria-expanded flips true -> false)", () => {
		const { container } = render(<AlbumShelf albums={ALBUMS} active={true} />);
		const map = songByArtist();
		const album = visibleAlbums(container).find((a) => map.has(a.artist));
		if (!album) throw new Error("no playable album rendered to test with");
		const song = map.get(album.artist);
		if (!song) throw new Error("unreachable");

		const coverButton = screen.getByRole("button", { name: playName(song) });
		fireEvent.click(coverButton);
		expect(coverButton.getAttribute("aria-expanded")).toBe("true");

		fireEvent.click(coverButton);
		expect(coverButton.getAttribute("aria-expanded")).toBe("false");
		expect(container.querySelectorAll("iframe").length).toBe(0);
	});

	// TC-AS-08
	it("opening a second playable cover moves the single player instead of stacking", () => {
		const { container } = render(<AlbumShelf albums={ALBUMS} active={true} />);
		const map = songByArtist();
		const playable = visibleAlbums(container).filter((a) => map.has(a.artist));
		const [firstAlbum, secondAlbum] = playable;
		if (!firstAlbum || !secondAlbum) {
			throw new Error(
				"need at least two playable albums rendered to test with",
			);
		}
		const firstSong = map.get(firstAlbum.artist);
		const secondSong = map.get(secondAlbum.artist);
		if (!firstSong || !secondSong) throw new Error("unreachable");

		fireEvent.click(screen.getByRole("button", { name: playName(firstSong) }));
		expect(container.querySelectorAll("iframe").length).toBe(1);

		fireEvent.click(screen.getByRole("button", { name: playName(secondSong) }));

		const iframes = container.querySelectorAll("iframe");
		expect(iframes.length).toBe(1);
		expect(iframes[0]?.getAttribute("src")).toContain(secondSong.youtubeId);
	});

	// TC-AS-09a
	it("clicking Next album closes the open player", () => {
		const { container } = render(<AlbumShelf albums={ALBUMS} active={true} />);
		const map = songByArtist();
		const album = visibleAlbums(container).find((a) => map.has(a.artist));
		if (!album) throw new Error("no playable album rendered to test with");
		const song = map.get(album.artist);
		if (!song) throw new Error("unreachable");

		fireEvent.click(screen.getByRole("button", { name: playName(song) }));
		expect(container.querySelectorAll("iframe").length).toBe(1);

		fireEvent.click(screen.getByRole("button", { name: "Next album" }));
		expect(container.querySelectorAll("iframe").length).toBe(0);
	});

	// TC-AS-09b
	it("clicking Previous album (once enabled) also closes the open player", () => {
		vi.useFakeTimers();
		const { container } = render(<AlbumShelf albums={ALBUMS} active={true} />);

		// Complete one full swap cycle so Previous becomes enabled, before
		// opening anything (the player itself would pause the swap).
		vi.advanceTimersByTime(INTERVAL_MS + OUT_MS + IN_MS);

		const map = songByArtist();
		const album = visibleAlbums(container).find((a) => map.has(a.artist));
		if (!album) throw new Error("no playable album rendered to test with");
		const song = map.get(album.artist);
		if (!song) throw new Error("unreachable");

		fireEvent.click(screen.getByRole("button", { name: playName(song) }));
		expect(container.querySelectorAll("iframe").length).toBe(1);

		const prevButton = screen.getByRole("button", { name: "Previous album" });
		expect((prevButton as HTMLButtonElement).disabled).toBe(false);

		fireEvent.click(prevButton);
		expect(container.querySelectorAll("iframe").length).toBe(0);
	});

	// TC-AS-10
	it("gives exactly the open cover aria-expanded=true; every other cover stays false", () => {
		const { container } = render(<AlbumShelf albums={ALBUMS} active={true} />);
		const map = songByArtist();
		const playable = visibleAlbums(container).filter((a) => map.has(a.artist));
		const target = playable[0];
		if (!target) throw new Error("no playable album rendered to test with");
		const song = map.get(target.artist);
		if (!song) throw new Error("unreachable");

		fireEvent.click(screen.getByRole("button", { name: playName(song) }));

		const expandableButtons = Array.from(
			container.querySelectorAll("button[aria-expanded]"),
		);
		expect(expandableButtons.length).toBe(playable.length);

		const expandedButtons = expandableButtons.filter(
			(b) => b.getAttribute("aria-expanded") === "true",
		);
		expect(expandedButtons.length).toBe(1);
		expect(expandedButtons[0]?.getAttribute("aria-label")).toBe(
			closeName(song),
		);
	});

	// TC-AS-11 (BLOCKER regression)
	it("unmounts the open player the instant active flips to false, with no timers advanced", () => {
		const { container, rerender } = render(
			<AlbumShelf albums={ALBUMS} active={true} />,
		);
		const map = songByArtist();
		const album = visibleAlbums(container).find((a) => map.has(a.artist));
		if (!album) throw new Error("no playable album rendered to test with");
		const song = map.get(album.artist);
		if (!song) throw new Error("unreachable");

		fireEvent.click(screen.getByRole("button", { name: playName(song) }));
		expect(container.querySelectorAll("iframe").length).toBe(1);

		rerender(<AlbumShelf albums={ALBUMS} active={false} />);

		expect(container.querySelectorAll("iframe").length).toBe(0);
	});
});
