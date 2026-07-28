# Scene frame budget - what the scroll journey costs, and the headroom for a cast

Wayfinder research asset for
[Frame budget: what the scene costs now, and the headroom on mobile](https://github.com/alp82/alperortac.com/issues/57),
on the [Ambient scene system](https://github.com/alp82/alperortac.com/issues/56) map.
Measured 2026-07-28. No decisions here. Measurements and the ceilings they imply.

## How this was measured

- Chrome 150.0.7871.124 headless, driven over the DevTools Protocol against the dev server at
  `http://localhost:3015/`. The landing page, from a cold navigation each run.
- Two device profiles. **Desktop** is 1512x945, DPR 1, no CPU throttle. **Mid-range phone** is
  390x844, DPR 3, CPU throttle 4x. A 6x profile stands in for a low-end phone.
- Three windows per run. **idle@day** is 3 seconds parked at scroll 0. **idle@night** is 3 seconds
  parked at the document end. **scroll** is a 6000px synthesized mouse scroll at 1200px/s.
- Frame rate comes from an in-page `requestAnimationFrame` probe. Main-thread cost comes from
  `Performance.getMetrics` deltas (`TaskDuration`, `RecalcStyleDuration`, `LayoutDuration`,
  `ScriptDuration`). Layer counts come from `LayerTree`.
- **Every run was done twice**, once with software rasterization (SwiftShader) and once with GPU
  rasterization and GPU compositing (Vulkan, RTX 5090). The two agree on every main-thread number
  and disagree only on blur. Both sets are reported where they differ.

Raw scripts and JSON live in the session scratchpad and are not committed. The numbers below are
reproducible from the method above.

### What the two raster modes are good for

CPU throttling slows the main thread only. It does not slow the GPU. So neither profile is a real
phone:

- The **main-thread numbers** (style recalc, script, layout, and therefore the per-element costs and
  the node budget) match between software and GPU raster. Treat them as sound.
- The **blur and raster numbers** differ by a factor of 3 or more. Software raster is the
  pessimistic bound. GPU raster on a 5090 is the optimistic bound. A real phone sits between, and
  closer to the GPU case, because Chrome enables GPU rasterization on effectively all current
  phones.

## The scene as it stands

Census of the landing page, identical on both profiles:

| Item | Count |
| --- | --- |
| DOM nodes, whole page | 3677 |
| DOM nodes inside `.dive-scene` | 180 |
| `.animate-twinkle` stars | 150 |
| `.animate-shooting-star` | 6 |
| `.dive-layer` depth layers | 8 |
| Elements with a running CSS animation, whole page | 191 |
| Compositor layers, desktop | 213 |
| Compositor layers, mid-range phone | 226 |

The 191 animating elements are 150 stars, 6 shooting stars, and 35 others spread across the page
(the ticker, the rack-net blinks, the globe spin, the hero blink, the Projects sun breathe).

Document height is 17985px on desktop and 22457px on the phone profile.

## Headline numbers

Main-thread task time per frame, GPU raster:

| Profile | idle@day | idle@night | scroll |
| --- | --- | --- | --- |
| Desktop | 3.3ms / 60fps | 2.8ms / 60fps | 4.5ms / 57fps |
| Mid-range phone (4x) | 17.6ms / 56fps | 15.7ms / 59fps | **28.8ms / 30fps** |
| Low-end phone (6x) | 54.9ms / 18fps | 21.6ms / 46fps | **44.3ms / 22fps** |

**The scene already scrolls at 30fps on a mid-range phone.** That is the shipped site today, before
any new cast member. Desktop holds 60fps with room to spare.

Software raster produced 30.1fps for the same mid-range scroll against the GPU run's 29.9fps. The
two agree, which fixes the diagnosis below.

## The scene is style-bound, not paint-bound or script-bound

Three measurements point the same way.

1. **Recalc counts are fixed per frame.** Every idle frame triggers exactly 1 style recalculation.
   Every scroll frame triggers exactly 2 (measured 1.00 and 1.97 recalcs per frame across all ten
   scenarios). One is the animation tick. The second is the journey driver's inline write.
2. **The cost of a single recalc grows linearly with the number of animating elements**, and with
   nothing else. On desktop it goes 0.70ms at 150 stars, 1.49ms at 450, 2.38ms at 750, 4.04ms at
   1350. On the phone profile it goes 2.86ms, 6.18ms, 10.03ms over the same range.
3. **Swapping the rasterizer changes nothing.** Software and GPU raster give the same mid-range
   scroll frame rate. If the scene were paint-bound, the GPU run would have pulled ahead.

Script time is a small share. During a desktop scroll the driver and React together account for
0.9ms of the 4.5ms frame. Layout is smaller still, at 0.17ms per frame. The comment block at
`src/components/_layout/scrollJourney/journeyTargets.ts:1-14` is confirmed: writing real properties
onto 18 elements is cheap, and the earlier root-custom-property design was the expensive one.

The cost that remains is the browser resolving animations. That cost is charged **per animating
element in the document, per frame**, whether or not the element is visible and whether or not the
driver touches it.

## The star field is the single largest item, and it runs when nobody can see it

`starsO` is `clamp01((skyProgress - 0.453) / (0.787 - 0.453))`, so the star layer sits at **opacity 0
for the first 45.3% of the journey**. `shootO` stays 0 for the first 78.7%. Opacity 0 does not stop a
CSS animation. All 156 elements keep ticking through the whole day half of the scroll.

Five gates were measured against the shipped scene. Mid-range phone, GPU raster:

| Case | Layers | idle@day | scroll |
| --- | --- | --- | --- |
| baseline (shipped) | 226 | 17.23ms / 57fps | 27.23ms / 30.3fps |
| L1 star layer `display: none` | 75 | 8.70ms / 60fps | 16.80ms / 50.1fps |
| L2 twinkle without the transform | 226 | 15.23ms / 59fps | 27.28ms / 30.6fps |
| L3 `animation-play-state: paused` | 226 | 9.83ms / 60fps | 19.31ms / 39.4fps |
| L4 `content-visibility: hidden` | 75 | 8.55ms / 60fps | 18.05ms / 46.0fps |
| L5 opacity-only twinkle plus pause | 226 | 9.94ms / 60fps | 22.22ms / 32.9fps |

Four results matter.

- **The star field costs 10.4ms of every scroll frame on a mid-range phone**, which is 38% of the
  frame. Removing it lifts scroll from 30.3fps to 50.1fps.
- **One compositor layer per star.** Layer count drops from 226 to 75 when the 150 stars go, and it
  rose by exactly 100, 300, 600 and 1200 when that many stars were added. Every animating element
  gets its own layer.
- **The transform in the keyframes is not what promotes them.** L2 dropped `transform: scale()` and
  kept opacity. Layer count stayed at 226 and the frame rate did not move. An opacity animation
  promotes just as readily.
- **`content-visibility: hidden` is the best gate.** L4 recovers 9.2ms of the 10.4ms and sheds 151
  layers. `animation-play-state: paused` (L3) recovers 7.9ms and sheds no layers, but it is a
  one-line change and it keeps the elements in the tree.

Combining an opacity-only keyframe with a pause (L5) is worse than the pause alone. Do not bother.

## Cost of one more animated element

Measured by adding 100, 300, 600 and 1200 extra stars to the real star layer, styled exactly like
the shipped ones, and fitting the slope. GPU raster.

| Profile | Per element, per frame, during scroll |
| --- | --- |
| Desktop | **0.018ms** |
| Mid-range phone (4x) | **0.066ms** |
| Low-end phone (6x) | ~0.10ms (extrapolated) |

The mid-range figure is confirmed independently: the 150 shipped stars cost 10.4ms, which is
0.069ms each.

A mid-range phone is 3.7x the desktop cost per element. **Mobile is the binding constraint by
roughly 3x**, so every roster decision should be judged on the phone number.

## The ceilings

### Node budget

The floor - what the page costs during a scroll with the star layer entirely gone - is **16.8ms per
frame on a mid-range phone** and 4.3ms on desktop.

- **60fps on a mid-range phone is already out of reach.** The 16.7ms budget is spent by the rest of
  the page before the scene contributes anything. This is not a cast problem and the cast cannot fix
  it.
- **Against a 30fps target on a mid-range phone (33.3ms), the scene may run about 250 elements
  animating at once.** That is (33.3 - 16.8) / 0.066.
- Today the scene uses 156 of those 250. **Free budget is about 95 concurrently animating
  elements.**
- Gate the stars off during the day and the full ~250 is free for the first 45.3% of the journey,
  because the stars are the thing occupying it.
- Desktop, against 60fps, allows about 690 concurrently animating elements. It will not be the
  limit.

The operative word is **concurrently**. The budget is not a roster size. It is how many members
animate in the same frame. A schedule that keeps members off outside their window buys the budget
back directly, which makes
[The schedule model](https://github.com/alp82/alperortac.com/issues/61) a performance mechanism and
not only an authoring convenience.

### Per-scroll-event budget

The driver writes 18 elements per frame today and costs one extra style recalculation: 0.70ms on
desktop, 2.86ms on a mid-range phone.

Adding 16 more layers, each written a fresh `translate3d` every scroll frame, cost **under 1ms per
frame on desktop and nothing measurable on the phone**. The number of elements written is not the
constraint. The number of elements *animating* is.

Budget: the driver may comfortably write **35 to 50 elements per frame**. Keep the parameterized
property vocabulary small for authoring reasons, not for performance reasons.

### Depth-layer count

Sixteen depth layers, each a full-viewport SVG with a per-frame transform write:

| Case | Desktop scroll | Mid-range phone scroll |
| --- | --- | --- |
| baseline (8 layers) | 59.6fps | 30.3fps |
| +4 parallax layers | 59.8fps | 29.7fps |
| +8 parallax layers | 59.8fps | 29.4fps |
| +16 parallax layers | 59.8fps | 28.9fps |
| +16, each blurred (GPU raster) | 59.8fps | 28.9fps |
| +16, each blurred (software raster) | **7.4fps** | 23.4fps |

**Depth layers are effectively free, and the depth ladder is not what caps the scene.** Twenty-plus
layers are affordable. Set the ceiling from art direction, not from frame budget.

One warning for [the --layer-depth contest](https://github.com/alp82/alperortac.com/issues/59):
**blur that changes while the layer moves forces a re-raster every frame.** On GPU raster that is
absorbed. On software raster four blurred full-viewport layers cut desktop scroll from 60fps to
22.7fps, and sixteen cut it to 7.4fps. The shipped dive already avoids this by gating blur behind
`body.dive-active`, so blur is static during scroll. Keep it that way. Do not key blur to scroll
depth.

## Two findings outside the frame budget

- **The grain overlay is a dead link.** `PixelBackground.tsx:382` loads
  `https://grainy-gradients.vercel.app/noise.svg`, and that URL returns **404** (verified over the
  network trace and directly with curl, 79 bytes of error body). The 0.03-opacity grain has not been
  rendering. It costs one cross-origin request of about 436ms and delivers nothing.
- **The page makes five more third-party requests**, all YouTube Shorts thumbnails from
  `i.ytimg.com`, about 125KB each and 1.7s to 3.9s each. They do not touch the scene, but they do
  compete for the main thread during the load window.

## What this constrains downstream

- [Lock the cast roster](https://github.com/alp82/alperortac.com/issues/58): design against **about
  250 concurrently animating elements on a mid-range phone**, of which the star field currently
  claims 156. Gating the stars by daylight is worth roughly 95 to 150 elements of budget on its own.
  A roster of a few dozen SVG members with a handful of animated parts each fits comfortably. A
  roster where every member has dozens of independently animating parts does not.
- [The --layer-depth contest](https://github.com/alp82/alperortac.com/issues/59): the layer count is
  free. Choose the depth ladder on how the parallax reads. Keep blur off the scroll path.
- [The schedule model](https://github.com/alp82/alperortac.com/issues/61): presence must actually
  stop the animation, not merely hide it. `opacity: 0` keeps the full cost. `content-visibility:
  hidden` or `animation-play-state: paused` removes most of it.
- [Bring the clouds and stars under the schedule](https://github.com/alp82/alperortac.com/issues/65):
  this is the largest single performance win available in the map, worth about 9ms of every scroll
  frame on a mid-range phone.
