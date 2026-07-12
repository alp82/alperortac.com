# Content balance audit - every section & subpage

Wayfinder research asset for [#2](https://github.com/alp82/alperortac.com/issues/2), feeding the
"Decide content balance targets per section" decision. Grounded in `src/data/*.ts` and the
components that own prose (`src/components/_layout/topics/*Content.tsx`, panel components).
Audited 2026-07-11. No decisions here - inventory only.

**Verdict scale**: sparse / balanced / over-detailed, judged against the surface's own job
(a hero is allowed to be thin; a flagship project subpage is not).

## Composer baseline (context for every "restyle hint")

- ~24 inner frame styles exist in `composer/inner/` (ticket-stub, polaroid, collectible,
  terminal, seed-packet, arcade-hud, aurora, blueprint, chalkboard, circuit-board, comic,
  constellation, daybreak, field-journal, floating-island, minimal, moonrise, neon-sign,
  parallax-depth, skyline, summit, topo-map, trail-signpost) plus link styles in `composer/links/`.
- **Every topic currently renders the same default inner (`parallax-depth`)** -
  `useComposerControls.defaultClusters()` assigns it to all topics, and DesignPanel selections
  are deliberately not persisted (no localStorage). No section identity is locked anywhere yet.
- The composer only covers the Craft band. Hero, Socials, Footer, and the subpage panels sit
  outside it.

## Main scroll journey

### Hero

- **Content**: avatar photo, "HEY, I'M ALPER." headline, two summary lines
  (`hero.ts` `HERO_SUMMARY`: "Web enthusiast and agentic coach with a side-project habit and a
  camera." / "Powered by passion and here to build genuinely authentic experiences."), scroll CTA.
- **Density**: **balanced** - thin by design; the hero's job is tone, not information.
- **Media has**: `alper-avatar.webp` portrait. **Wants**: nothing content-wise; any additions are
  atmosphere (sky/landscape layer), not copy.
- **Composer hint**: outside the composer; identity comes from the sky system.

### Socials (Find Me)

- **Content**: live Shorts carousel (5 shorts in auto-generated `youtubeShorts.ts` with titles,
  views, dates; regenerated via `bun run generate:shorts`) + three chip groups from
  `socialLinks.tsx`: Posts (X, Threads, Bluesky, Reddit), Video (YouTube, TikTok, Instagram),
  Pro (GitHub, LinkedIn). All 9 chips have live hrefs; the disabled "Coming soon" chip state
  exists but is unused. Note: the map calls the groups VIDEO/POSTS/CODE; the shipped labels are
  Posts/Video/Pro.
- **Density**: **balanced** - showcase-first redesign is in and carries the section.
- **Media has**: YouTube thumbnails (derived from video ids), `youtube-avatar.jpg`.
  **Wants**: nothing missing; shorts list is only as fresh as its last regeneration.
- **Composer hint**: outside the composer.

### Craft band - the 10 topics

All ten share the default `parallax-depth` frame today; "hint" below = existing inner styles that
obviously suit the topic, as candidates for the identity decision, not choices.

| Topic | Content today | Density | Media has → wants | Restyle hints from existing inners |
|---|---|---|---|---|
| **Career** | 2-para teaser (`CAREER_TEASER`) + the **full 7-entry timeline** with stack chips rendered on the band (`CareerContent`), then the same 7 entries again in the subpage | **over-detailed** (only topic dumping its whole dataset on the band; 1:1 duplicate of its subpage) | none → possibly company/era marks | trail-signpost, summit |
| **Coding** | 1-para teaser (`CODING_TEASER`) + early-days trigger card | **sparse** | none → maybe a code/setup visual | terminal |
| **Tech Stack** | 2 paras + 7-item self-hosted list + 3-item cloud list | **balanced** | none → tool logos optional | circuit-board, blueprint |
| **AI** | 4 paras + 5 cards (alp-river GitHub, Alp-River trigger, Discord, aistack.to, AIStack trigger) | **balanced**, richest topic; card-heavy tail | none → none pressing | circuit-board, terminal |
| **Finance** | 2 short paras + 1 GitHub card (German trading talk) | **sparse** | none → chart/graph texture? | topo-map (contour ≈ chart), chalkboard |
| **Family** | 1 informal lowercase para (authentic voice - keep verbatim) | **sparse** | none → photo-shaped media (kept anonymous?) | polaroid, seed-packet |
| **Travel** | 2 paras (countries, geocaching) | **sparse** | none → **ticket-stub imagery named by the map**; stamps/routes | ticket-stub, field-journal, topo-map |
| **Movies & TV** | 3 paras + goodwatch.app card + GoodWatch trigger | **balanced** | none → poster-wall texture? | comic, collectible |
| **Games** | 2 paras (character name-drops, THPS 2) + manaschmiede card + trigger | **sparse-to-balanced** | none → pixel/cartridge texture? | arcade-hud, collectible, comic |
| **Music** | 2 paras + Last.fm card ("275k scrobbles since 2006" badge) + Spotify card + Music trigger | **balanced** on the band | none → **album covers named by the map** (belong to the subpage more than the band) | neon-sign, moonrise, aurora, constellation |

Cross-topic pattern: the band splits into a rich half (Career, AI, Tech Stack, Movies & TV, Music)
and a thin half (Coding, Finance, Family, Travel, Games). No topic on the band has any visual
media - identity currently rides entirely on prose and cards.

### Footer / Collab

- **Content**: typewriter headline ("Let's" + 9 rotating phrases from `footer.ts`), mailto
  contact (`hello@alperortac.com`, subject "Hello", placeholder "tell me about it..."),
  "Things I'm building" inline links to all 4 projects, FollowMeRow socials, copyright,
  "To the sky" return link.
- **Density**: **balanced**.
- **Media has**: none. **Wants**: none.

## Subpages (dive panels)

### Career ("Work History")

- **Content**: title, one-line intro, the same 7 `CAREER_TIMELINE` entries as the band, in an
  alternating left/right timeline.
- **Density**: **sparse in depth** - it re-renders the band's dataset with zero subpage-exclusive
  content, so the dive adds layout, not substance. The strongest duplication problem in the site.
- **Media has**: none. **Wants**: anything that rewards the dive (stories per stop, artifacts,
  logos - for the targets decision).

### The Early Days (story)

- **Content**: icon tile, title, 2 paras of hardcoded prose (QBasic at 12, Turbo Pascal, Delphi,
  HTML/CSS at 16, IRC/ICQ, LAN parties). Prose lives in `EarlyDaysPanel.tsx`, not a data file.
- **Density**: **sparse** - good seed prose, no arc beyond two paragraphs.
- **Media has**: none. **Wants**: era texture (CRT, pixel art, retro screenshots).

### GoodWatch

- **Content**: sticky title bar, demo video, problem/solution/outcome prose, 5 stack chips, tags,
  visit CTA (`projects.ts`).
- **Density**: **balanced** - the template is complete and the copy is specific.
- **Media has**: mp4+webm demo video. **Wants**: poster frames - `poster` is unset and marked
  `TODO(alp): generate proper poster frames`; reduced-motion visitors currently get an icon
  placeholder instead of an image.

### AIStack

- **Content**: same template, full problem/solution/outcome, 4 stack chips.
- **Density**: **balanced**.
- **Media has**: mp4+webm hero video. **Wants**: poster frames (same TODO).

### Alp-River

- **Content**: same template, full prose, 3 stack chips.
- **Density**: **balanced prose, sparse media**.
- **Media has**: none - media is `{ type: "illustration" }`, rendering an icon placeholder marked
  `TODO(alp): swap for real Alp-River artwork`. **Wants**: real artwork or a terminal-style demo.

### Manaschmiede

- **Content**: same template, full prose (deck-creation framing), 3 stack chips.
- **Density**: **balanced**.
- **Media has**: mp4+webm deck-creation video. **Wants**: poster frames (same TODO).

### Music (personal panel)

- **Content**: icon tile, title, a hardcoded **"PLACEHOLDER - content coming soon"** banner, and a
  teaser paragraph that renders **empty**: `PanelHost` builds `PERSONAL_TEASER` from
  `Topic.teaser`, but the Music topic was promoted to a component and carries no teaser string,
  so the `?? ""` fallback fires. The subpage is effectively blank.
- **Density**: **sparse** - the least finished surface on the site.
- **Media has**: none. **Wants**: album covers (named by the map), Last.fm-fed listening data is
  already linked from the band and could feed this panel.

## Sharpest imbalances (for the targets decision)

1. **Career** is the only surface that is simultaneously over-detailed (band) and undifferentiated
   (subpage duplicates it 1:1).
2. **Music subpage** is blank behind a placeholder banner - the largest gap between a locked map
   ambition (album covers) and shipped content.
3. **Thin-half topics** (Coding, Finance, Family, Travel, Games) each carry 1-2 paragraphs and no
   media, while the rich half carries 3-4 paragraphs plus cards - the band's rhythm is uneven.
4. **Zero visual media anywhere on the Craft band**; the only content media on the site are the
   three project videos (all missing poster frames) and the Alp-River illustration placeholder.
5. **No section identity is locked** - every topic renders the same default frame, so the ~24
   existing inner styles are an unspent budget.
