/*
 * Alfredo subpage artwork (wayfinder #76).
 * The tree IS the section: Alfredo names three pieces of its own setup, and the
 * drawing is those three tiers - the HQ, the porter on each server, the trays a
 * porter sets out. Each tier carries the word it draws and that word's own
 * one-line definition, so the section body's "three words" sentence points at
 * something the reader can actually read.
 *
 * MEASURED, NOT INVENTED (the AGENTS.md rule). Every string below is
 * transcribed from the "Under the hood" tree that getalfredo.com publishes
 * itself, read off the live page and its route bundle on 2026-07-28. Nothing
 * here is a schematic stand-in: re-read that section and update these two
 * exports when the live tree changes. AlfredoTree.test.tsx pins both, so a
 * silent drift goes red.
 *
 * No host is named. "SERVER 01" is a position in the drawing, not a machine,
 * and the artwork publishes no hostname, scheme, or address - the same rule
 * CuriaThread holds to.
 *
 * Static by design (the CuriaThread and StatuslineStrip precedent): nothing
 * animates, so reduced motion needs no special casing.
 */

// Alfredo's own dark surface, so the tree reads as its page. The landing's
// coral accent (#ff5d49) is used HERE, inside the drawing, where it cannot
// collide with the band's terracotta or GoodWatch's red - unlike the card tint,
// which stays amber for exactly that reason.
const BG_FRAME = "#0c0f0c";
const BG_SURFACE = "#14150e";
const BG_NODE = "#1e1b10";
const RULE = "#3a3a2e";
const ACCENT = "#ff5d49";
const TEXT = "#e9e7dd";
const TEXT_MUTED = "#8d8b7d";

/** The three words, in the order the live page introduces them. */
export const ALFREDO_TERMS = [
	{ word: "HQ", lede: "Your headquarters." },
	{ word: "PORTER", lede: "Alfredo's worker on each of your servers." },
	{
		word: "TRAY",
		lede: "One integration, ready to use: analytics, email, payments, auth.",
	},
] as const;

/** The measured shape below the HQ: one porter per server, its trays under it. */
export const ALFREDO_PORTERS = [
	{ sub: "SERVER 01", trays: ["ANALYTICS", "DATABASE", "EMAIL"] },
	{ sub: "SERVER 02", trays: ["PAYMENTS", "UPTIME"] },
] as const;

// The porter tier and the tray tier share one two-column track, so a tray
// column always sits under the porter that sets it out. Declared once: split
// them and the two rows drift out of alignment on the first edit.
//
// Two columns at EVERY width, deliberately. Walked at 390x844 (#76): collapsing
// to one column on narrow flattened the five trays into a single list, and the
// drawing stopped saying which porter serves which tray - which is the only
// thing the tier is drawn to show. The words are short enough to hold a ~145px
// column at 390px, so the grouping survives instead of the line length.
const TIER_COLUMNS = "mt-2 grid grid-cols-2 gap-3";

/** The small-caps word in each tier's left gutter. */
function TierLabel({ children }: { children: React.ReactNode }) {
	return (
		<span
			className="text-[9px] font-black uppercase tracking-[0.25em]"
			style={{ color: ACCENT }}
		>
			{children}
		</span>
	);
}

/** The definition line under a tier. */
function Lede({ children }: { children: React.ReactNode }) {
	return (
		<p className="mt-2 text-[11px] leading-snug" style={{ color: TEXT_MUTED }}>
			{children}
		</p>
	);
}

/** A hairline drop between two tiers. */
function Drop() {
	return (
		<span
			aria-hidden="true"
			className="mx-auto block h-4 w-px"
			style={{ backgroundColor: RULE }}
		/>
	);
}

export function AlfredoTree() {
	const [hq, porter, tray] = ALFREDO_TERMS;
	return (
		<div
			role="img"
			aria-label={
				"The three words Alfredo uses for its own setup, drawn as a tree. " +
				"At the top the HQ, the one dashboard every project reports to. " +
				"Below it a porter on each of two servers, the worker that deploys " +
				"your projects and reports back. Under the first porter the analytics, " +
				"database and email trays; under the second the payments and uptime " +
				"trays. A tray is one integration, set out once and served to every " +
				"project that needs it."
			}
			className="mb-6 flex justify-center"
		>
			<div
				aria-hidden="true"
				className="w-full max-w-[34rem] overflow-hidden rounded-lg border p-1.5 shadow-[0_10px_40px_rgba(0,0,0,0.45)]"
				style={{ backgroundColor: BG_FRAME, borderColor: RULE }}
			>
				<div
					className="rounded-md px-4 py-4"
					style={{ backgroundColor: BG_SURFACE }}
				>
					{/* HQ. The word labels the node directly - there is exactly one
					    headquarters, so the tier gutter the other two words need would
					    only say it twice. */}
					<div className="text-center">
						<div
							className="mx-auto w-full max-w-[13rem] rounded border px-4 py-2.5 text-[13px] font-black uppercase tracking-[0.25em]"
							style={{
								backgroundColor: BG_NODE,
								borderColor: ACCENT,
								color: ACCENT,
							}}
						>
							{hq.word}
						</div>
						<Lede>{hq.lede}</Lede>
					</div>

					<Drop />

					{/* PORTER - one per server, side by side (stacked on narrow) */}
					<div className="text-center">
						<TierLabel>{porter.word}</TierLabel>
						<div className={TIER_COLUMNS}>
							{ALFREDO_PORTERS.map((p) => (
								<div
									key={p.sub}
									className="rounded border px-3 py-2 text-[11px] font-bold uppercase tracking-widest"
									style={{
										backgroundColor: BG_NODE,
										borderColor: RULE,
										color: TEXT,
									}}
								>
									{p.sub}
								</div>
							))}
						</div>
						<Lede>{porter.lede}</Lede>
					</div>

					<Drop />

					{/* TRAY - grouped under the porter that sets them out, so the two
					    columns stay aligned with the row above. */}
					<div className="text-center">
						<TierLabel>{tray.word}</TierLabel>
						<div className={TIER_COLUMNS}>
							{ALFREDO_PORTERS.map((p) => (
								<ul key={p.sub} className="flex flex-col gap-1.5">
									{p.trays.map((t) => (
										<li
											key={t}
											className="rounded-sm border border-dashed px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em]"
											style={{
												borderColor: RULE,
												color: TEXT_MUTED,
											}}
										>
											{t}
										</li>
									))}
								</ul>
							))}
						</div>
						<Lede>{tray.lede}</Lede>
					</div>
				</div>
			</div>
		</div>
	);
}
