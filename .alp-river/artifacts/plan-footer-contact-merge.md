<APPROVED_PLAN version="1">

## Approach
Absorb the standalone `CTASection` into the footer so the footer becomes the single contact surface. The footer's existing `FooterHeadline` (the "Let's…" typewriter) already sits at the footer top and serves as the CTA headline; below it we add a small stateful `FooterContact` (controlled textarea + an "Email me" `mailto:` anchor whose `href` is recomputed every render from the typed message). The `contact` anchor moves onto the `<footer>` element itself, and the old block plus its now-dead `footer` id are deleted.

## Plan Breakdown
Right now the site has a separate "Contact" block sitting just above the footer, and the footer is a quiet sign-off. This change merges them: the footer becomes the place you get in touch. The footer's existing "Let's…" animated headline stays at the top and now acts as the contact heading, and just under it we add a message box plus an "Email me" button. As you type into the box, the button's email link updates in real time, so clicking it opens your mail app with the message already filled in (subject pre-set, your text as the body) addressed to alportac@gmail.com. The "Contact" link in the top nav now scrolls to the top of the footer instead of the old block, and the old block is removed entirely.

Flow: `nav "Contact" → footer top → "Let's…" headline → message box → Email me (mailto, live-updated)`

Milestones (advisory):
1. Add the message box and live "Email me" button to the bottom of the footer as a self-contained, tested unit (additive; old contact block still present, no duplicate anchor yet).
2. Repoint the "Contact" anchor to the footer top and delete the old standalone contact block and its dead id, leaving the footer as the one contact surface.

## Files to Modify
- `src/data/footer.ts` - add three copy/contact constants alongside the existing footer copy: `CONTACT_EMAIL = "alportac@gmail.com"` (centralizing the address currently hardcoded in `CTASection`), `CONTACT_SUBJECT = "Let's collaborate"` (the predefined subject line - none existed before; on-brand with the "Let's…" headline and the "Collab" minimap label; a one-line constant the user can tweak), and `CONTACT_PLACEHOLDER = "Tell me what you're building…"`.
- `src/components/_layout/footer/FooterSection.tsx` - (a) change the `<footer>` element's `id` from `SECTION_IDS.footer` to `SECTION_IDS.contact` so the footer top IS the contact anchor; (b) import and render `<FooterContact />` immediately after `<FooterHeadline />`, wrapping the two in a `<div className="flex flex-col gap-6">` so the headline + field + button read as one contact cluster, placed above the projects block. `SECTION_IDS` import stays (still used for `.contact` and `.start`).
- `src/data/sections.ts` - remove the now-dead `footer: "footer"` key from `SECTION_IDS` (after the id swap nothing references it; the sections test only asserts `findMe`/`craft`/`contact`). `MINIMAP_BOUNDARIES` and `SECTION_IDS.contact` are untouched.
- `src/routes/_layout.tsx` - delete the `CTASection` import (line 5) and its `<CTASection />` render (line 424). No nav or CSS change needed: the "Contact" nav link (`href={#${SECTION_IDS.contact}}`, line 400) now resolves to the footer, and the existing `#contact { scroll-margin-top: 80px }` rule (line 450) now offsets the footer under the sticky nav.
- `src/components/_layout/CTASection.tsx` - DELETE this file. Fully absorbed: its headline role is filled by the existing `FooterHeadline`, its email button by `FooterContact`; the old "Contact" `<h2>` and the coaching/consulting paragraph are dropped (the confirmed layout is headline → field → button only).
- `AGENTS.md` - update the two structure bullets (lines 16-17) to reflect that the Collab/contact CTA now lives in the footer rather than a dedicated block; and check off the "footer + contact merge" item in `TASKS.md` (line 123). Keeps the live spec from contradicting the shipped structure.

## Files to Create
- `src/components/_layout/footer/FooterContact.tsx` - exports `function FooterContact()`. Holds `const [message, setMessage] = useState("")`. Derives, every render (pure, no effect/memo), `const mailtoHref = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(CONTACT_SUBJECT)}&body=${encodeURIComponent(message)}``. Renders a `flex flex-col gap-4` group containing: an `sr-only` `<label htmlFor="contact-message">Your message</label>`; a controlled `<textarea id="contact-message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder={CONTACT_PLACEHOLDER} rows={4}>` styled to the footer's dark brutalist palette (`w-full bg-white/5 border-2 border-current/30 px-4 py-3 text-base text-current placeholder:text-current/50 resize-y focus:outline-none focus-visible:ring-2 focus-visible:ring-current`); and the "Email me" anchor `<a href={mailtoHref}>` reusing the old CTA button treatment plus `self-start` so it doesn't stretch full width: `inline-flex items-center gap-3 self-start bg-white text-slate-900 px-6 py-4 font-black uppercase text-sm tracking-widest shadow-[6px_6px_0px_0px_rgba(255,255,255,0.4)] hover:-translate-y-1 transition-transform`, with `<Mail size={18} aria-hidden="true" />` then `Email me`. (Stateful footer child is already the norm - `FooterHeadline` runs `useTypewriterCycle`; no SSR concern.)
- `src/components/_layout/footer/__tests__/FooterContact.render.test.tsx` - ALREADY WRITTEN in the red phase. Do not rewrite; implement to make it pass.

## Implementation Steps
(ordered by dependency)
1. Add `CONTACT_EMAIL`, `CONTACT_SUBJECT`, `CONTACT_PLACEHOLDER` to `src/data/footer.ts`.
2. Create `src/components/_layout/footer/FooterContact.tsx` per the signature above (consumes the step-1 constants).
3. In `FooterSection.tsx`, import `FooterContact` and render it under `FooterHeadline` inside a new `gap-6` wrapper, above the projects block.
4. In `FooterSection.tsx`, swap the `<footer>` `id` to `SECTION_IDS.contact`; in `src/data/sections.ts`, remove the dead `footer` key. (Land together so there is never a moment with two `id="contact"` in the DOM.)
5. Delete `src/components/_layout/CTASection.tsx`; remove its import (line 5) and `<CTASection />` (line 424) from `src/routes/_layout.tsx`.
6. Sync `AGENTS.md` bullets (16-17) and check off `TASKS.md` line 123.
7. Run typecheck, the test suite (sections + footer + new FooterContact), and a production build.

## Reuse
- `src/components/_layout/CTASection.tsx:16` - the "Email me" button class treatment + `Mail` icon is lifted verbatim (plus `self-start`) into `FooterContact`'s anchor.
- `src/components/_layout/CTASection.tsx:15` - the hardcoded `mailto:alportac@gmail.com` address is promoted to `CONTACT_EMAIL` in `footer.ts`.
- `src/data/footer.ts` (`FOOTER_ROLES = ["Let's"]`) via `FooterHeadline` - the existing "Let's…" typewriter IS the required CTA headline; reused in place.
- `src/routes/_layout.tsx:450` - the existing `#contact { scroll-margin-top: 80px }` rule already gives the contact anchor its under-nav offset; moving the id onto the footer reuses it with no CSS change.

## Out of Scope
- Visual redesign beyond the field + button (match the existing brutalist palette).
- A real in-page send (SMTP / form backend / validation): the intent specifies a `mailto:` link.
- Empty-field guarding or disabling the button: the intent allows an empty body.
- `mailto:` URL-length ceilings for very long messages.

## Acceptance
- The footer contains the "Let's…" headline, a message textarea, and an "Email me" mailto button, in that order.
- The mailto href targets CONTACT_EMAIL, carries the predefined CONTACT_SUBJECT (encoded), and the body is the live URL-encoded textarea content, updating as the user types.
- The `contact` anchor resolves to the top of the footer; the standalone CTASection no longer renders.
- Removing `SECTION_IDS.footer` leaves the existing sections test green.

</APPROVED_PLAN>
