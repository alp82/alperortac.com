# Legal song-snippet playback for the Music subpage

> Research ticket: #25. Consumer: #27 (snippet players on `/music`).
> Question: **Can the Music subpage legally play short audio snippets of *specific parts* of songs Alper loves — and via what mechanism?**
> Researched 2026-07-18 against primary sources (official API docs, terms of service, statutes, CJEU/BGH case law).

## TL;DR

- **Self-hosting clips is out.** Under German/EU law even a ~2-second recognizable sample of a recording is an infringing reproduction (CJEU *Pelham*), there is no fair-use doctrine, the quotation exception does not cover "songs I love" decoration, and the master-recording license a private person would need is not practically obtainable. GEMA alone is not enough.
- **No preview API lets you choose which part of the song plays.** Apple, Deezer, and Spotify all serve a fixed, provider-chosen ~30 s segment. Spotify has removed `preview_url` for new apps entirely; Deezer has frozen new app registrations.
- **Only YouTube lets an anonymous visitor start at an arbitrary second of the full recording** (`start` parameter / `startSeconds`), at the price of a visible video player (≥ 200×200 px, no audio-only/background use).
- **Recommended combo for #27:** iTunes Search API 30 s previews in a custom player (full UI control, keyless, legal, but Apple picks the segment) + YouTube IFrame embed with `start`/`end` for the few songs where the *exact passage* is the point.

---

## 1. Provider preview APIs

### 1.1 Apple — iTunes Search API (and Apple Music API)

The iTunes Search API returns `previewUrl`, "a URL referencing the 30-second preview file" for tracks ([Search API docs & terms](https://performance-partners.apple.com/search-api)).

| Aspect | Finding |
|---|---|
| Snippet length | 30 s static audio file |
| Start point selectable? | **No.** Apple pre-cuts the segment; no offset parameter exists. Same for the Apple Music API's [`Preview` object](https://developer.apple.com/documentation/applemusicapi/preview) (only `url`, `hlsUrl`, `artwork`). |
| Auth | None for the Search API. Apple Music API/MusicKit needs a signed [developer token](https://developer.apple.com/documentation/applemusicapi/generating-developer-tokens) (paid Developer Program). |
| Rate limit | "Approximately 20 calls per minute (subject to change)" ([docs](https://performance-partners.apple.com/search-api)) |
| Attribution | Previews must be attributed "provided courtesy of iTunes", placed near a badge/link to the Apple store pages; previews must be "streamed only, and not downloaded, saved, cached" ([terms on the same page](https://performance-partners.apple.com/search-api)). |
| Personal site OK? | Yes, as long as use is promotional — snippet + link out to Apple Music, not a standalone jukebox divorced from linking. |

### 1.2 Deezer API

The track object still exposes a 30 s `preview` MP3 — verified live: `GET https://api.deezer.com/track/3135556` returns a ~30 s MP3 on `cdnt-preview.dzcdn.net`, no key needed ([track docs](https://developers.deezer.com/api/track)).

- **Start point selectable? No** — one static pre-cut MP3 per track.
- **New app registration is disabled.** Deezer staff (Oct 2025): abuse "led us to disable the possibility of creating new accesses" ([official Deezer community, staff reply](https://en.deezercommunity.com/features-feedback-44/api-auth-impossible-80857)). Only the keyless public GET endpoints still function — workable today, but the weakest long-term footing of the three.
- Terms *mandate* non-commercial use (Section IV), require Deezer branding per its Trademark Guidelines (Section VII) and forbid downloading/caching the content (Section V) ([Deezer API Terms of Use](https://developers.deezer.com/termsofuse)).
- Rate limit: 50 requests / 5 s per the developer portal (JS-rendered page; number documented but not re-verifiable in this session).

### 1.3 Spotify

- **`preview_url` is gone for new apps.** The official blog post ["Changes to the Web API" (2024-11-27)](https://developer.spotify.com/blog/2024-11-27-changes-to-the-web-api) removed 30-second preview URLs for apps registered on/after that date; the [Get Track reference](https://developer.spotify.com/documentation/web-api/reference/get-track) now marks `preview_url` deprecated and notes "Audio Preview Clips may not be offered as a standalone service or product."
- The sanctioned alternative is the **[Spotify Embed](https://developer.spotify.com/documentation/embeds)** (see §2.2): anonymous visitors get "a preview clip of less than 30 seconds" ([troubleshooting](https://developer.spotify.com/documentation/embeds/tutorials/troubleshooting)); full tracks require a logged-in (in practice Premium) user — the login split is officially under-documented.
- Attribution under the [Developer Policy](https://developer.spotify.com/policy) and [Design Guidelines](https://developer.spotify.com/documentation/design): Spotify marks required, metadata/previews "must be accompanied by a link back" to Spotify, logo ≥ 70 px / icon ≥ 21 px.

**Cross-provider bottom line: none of the three preview APIs lets the site choose which part of the song the snippet covers.** All serve a fixed, provider-chosen segment.

---

## 2. Embeds as the fallback — start-position control

### 2.1 YouTube — the only deterministic start point for anonymous visitors

- `start` / `end` URL parameters (integer seconds) are officially supported ([player parameters](https://developers.google.com/youtube/player_parameters)); the IFrame API adds `loadVideoById`/`cueVideoById` with float `startSeconds`/`endSeconds` and runtime `seekTo()` ([IFrame API reference](https://developers.google.com/youtube/iframe_api_reference)). Caveat: playback snaps to the nearest keyframe (up to ~2 s early).
- Anonymous visitors get the **full recording** (with video) — no preview tier.
- Hard constraints from the [Developer Policies](https://developers.google.com/youtube/terms/developer-policies) and [Required Minimum Functionality](https://developers.google.com/youtube/terms/required-minimum-functionality):
  - must not "separate, isolate, or modify the audio or video components" (III.I.7) — **no audio-only use**;
  - no background/hidden players (III.I.9) — the player must be visible on the page the user is viewing;
  - minimum player size **200×200 px**, no overlays obscuring the player, autoplay only when > 50 % visible and one autoplaying player per page.
- Autoplay is additionally subject to browser policies (`onAutoplayBlocked`; mute-first is the documented workaround). No API key needed for embedding.

### 2.2 Spotify embed

- The plain iframe documents a custom start point **only for podcast episodes** ([embeds docs](https://developer.spotify.com/documentation/embeds)). The [iFrame API](https://developer.spotify.com/documentation/embeds/references/iframe-api) does offer `loadEntity(uri, preferVideo, startAt)` and `seek()` (documented in podcast terms) — but for music the anonymous visitor cannot be guaranteed more than the < 30 s preview clip, whose timeline is Spotify's segment, so a start offset into the full track is moot without a logged-in Premium user.
- No keys needed; keep `allow="encrypted-media"` intact or the embed degrades to preview-only ([troubleshooting](https://developer.spotify.com/documentation/embeds/tutorials/troubleshooting)).

### 2.3 Apple Music embed / MusicKit JS

- The `embed.music.apple.com` iframe has **no start-time parameter** (only sizing; [Apple Music Marketing Tools](https://artists.apple.com/support/1117-apple-music-marketing-tools)). Logged-out listeners hear a 30-second clip; subscribers hear full tracks.
- MusicKit JS offers `seekToTime()`, but for unauthenticated visitors "playback is restricted to non-DRM preview assets" — seeking addresses the ~30 s preview's own timeline, not the full song ([MusicKit v3 docs](https://js-cdn.music.apple.com/musickit/v3/docs/index.html)). MusicKit also requires a signed developer token (paid Apple Developer Program).

**Embed bottom line: YouTube is the only official embed that starts an anonymous visitor at an arbitrary second of the full recording — and it demands a visible video player in return.**

---

## 3. Self-hosted clips — the legal analysis (Germany/EU)

Site owner is in Germany, so German law (UrhG) and the EU InfoSoc Directive govern. Hosting a clip = reproduction (§ 16 UrhG) **and** making available to the public ([§ 19a UrhG](https://www.gesetze-im-internet.de/urhg/__19a.html); [Directive 2001/29/EC Arts. 2–3](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32001L0029)) of **two separate rights layers**:

1. **The composition/lyrics** (authors' rights, administered by GEMA). GEMA does license small personal-website use — [Tarif VR-OD 10](https://www.gema.de/de/musiknutzer/tarifuebersicht/tarif-vr-od-10) (successor to VR-W) covers low-volume streaming on one's own site.
2. **The master recording** ([§ 85 UrhG](https://www.gesetze-im-internet.de/urhg/__85.html) — the label's exclusive reproduction/making-available right), plus performers' rights (§§ 73 ff.). GEMA's own help page warns a GEMA license does **not** cover this — neighbouring rights must be cleared separately with the rightsholders ([gema.de](https://www.gema.de/en/w/help/users/use-music/social-media-websites/background-music-on-website)). On-demand master licenses are negotiated individually with labels and are not practically obtainable by private individuals. GVL's only website tariff, [Tarif 18 "Hintergrundmusik auf Websites"](https://gvl.de/sites/default/files/2021-05/tarif_18_website_hintergrundmusik_20150326.pdf), covers exclusively **non-interactive, unaltered** transmission ≤ 15 min total — a click-to-play gallery of chosen excerpts is interactive and edited, so it does not qualify.

Why no short-clip escape hatch exists:

- **No de minimis.** CJEU [*Pelham* C-476/17](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A62017CJ0476) (Grand Chamber, 2019): a phonogram producer can prevent use of a sample "even if very short," unless modified to be "unrecognisable to the ear." The BGH applied this in [*Metall auf Metall IV*, I ZR 115/16 (2020)](https://bundesgerichtshof.de/SharedDocs/Pressemitteilungen/DE/2020/2020040.html) to a ~2-second rhythm sample. A deliberately recognizable 10–30 s excerpt is a fortiori infringing.
- **Quotation (§ 51 UrhG / Art. 5(3)(d)) doesn't apply.** [§ 51 UrhG](https://www.gesetze-im-internet.de/urhg/__51.html) requires the use be justified by a specific quotation purpose; the CJEU requires the quoter to "enter into 'dialogue'" with the work (*Pelham* para. 71) and to establish "a direct and close link between the quoted work and his own reflections" ([*Spiegel Online* C-516/17](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A62017CJ0516), paras. 78–83). A snippet played because the site owner loves the song is decoration — it has no *Belegfunktion* and fails outright; even per-song written commentary would be a thin, risky argument for 30 s of unaltered audio.
- **No fair use.** The EU exception catalogue is exhaustive (*Pelham*, operative part pt. 3; implemented as the closed list in [§§ 44a ff. UrhG](https://www.gesetze-im-internet.de/urhg/BJNR012730965.html)). US fair use is irrelevant to a German operator — and even in the US the "30 seconds is fine" belief is a myth ([US Copyright Office: no formula](https://www.copyright.gov/fair-use/)).
- **Real enforcement risk.** Music rightsholders enforce via *Abmahnung* (cease-and-desist with attorney costs plus damages); [§ 97a UrhG](https://www.gesetze-im-internet.de/urhg/__97a.html) caps first-time private infringers' fee basis at €1,000 but does not eliminate exposure. A publicly crawlable site hosting recognizable major-label audio is exactly the pattern content-identification targets; liability for injunction/costs is strict.

**Conclusion: there is no defensible self-hosted short-clip route for this use case.** The only lawful self-hosted audio would be music Alper actually holds rights to (own recordings, explicit licenses, genuinely CC-licensed works).

---

## 4. Recommendation (for #27)

**Primary mechanism: iTunes Search API 30 s previews, played in the site's own custom player.**

- Keyless, free, legally clean, and the only preview source that allows a fully custom UI (e.g. the existing waveform aesthetic) rather than provider chrome.
- Constraints to build in:
  - **Apple picks the ~30 s segment** — no start-point choice at the API level. Within that window the HTML5 `<audio>` element can seek freely, so a per-song `highlightRange` *inside the preview* is possible, but "play the bridge at 2:41" is not.
  - Stream directly from Apple's CDN — do **not** download, cache, or proxy the preview audio (terms).
  - Show "provided courtesy of iTunes" attribution and an Apple Music badge/link per track.
  - ~20 calls/min rate limit: resolve `previewUrl` lazily on the client per play-click (URLs are not guaranteed stable, so don't bake them into the repo data; store artist/track/iTunes track ID instead).
- Deezer is a functional keyless fallback but registrations are frozen — don't build on it. Spotify offers nothing usable for new apps beyond its branded embed.

**Secondary mechanism, for songs where the *exact passage* is the point: YouTube IFrame embed with `start` (and optionally `end`).**

- The only legal way to start an anonymous visitor at a chosen second of the full recording.
- UI cost: the video player must be visible (≥ 200×200 px), cannot be hidden or audio-only-ified, no obscuring overlays, autoplay unreliable (mute-first). Model it as an expandable "watch this moment" card rather than an inline audio snippet.

**Explicitly rejected: self-hosted clips** — dual-layer licensing (GEMA + per-label master clearance) is unobtainable for the master side, *Pelham* forecloses any de-minimis argument, § 51 UrhG quotation fails for decorative favorites, and Abmahnung risk is concrete (§ 3).

**Suggested data shape for #27:** per song store `{ itunesTrackId, appleMusicUrl, youtubeId?, youtubeStart?, youtubeEnd?, previewHighlight?: { start, end } /* seconds within Apple's 30 s preview */ }`. The player component streams the iTunes preview through the custom UI with the courtesy-of-iTunes credit and Apple Music link; songs with a `youtubeId` additionally offer the visible "exact moment" YouTube embed.
