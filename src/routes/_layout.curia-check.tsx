import { createFileRoute } from "@tanstack/react-router";

// Throwaway test fixture for the curia golden-thread run (#67). A later
// ticket deletes this page. Hard-coded data by design - no data source.
//
// The _layout Outlet renders inside an inline display:none wrapper (subpage
// content normally arrives via PanelHost). The scoped <style> below unhides
// that wrapper only while this route's <main> is inside it, so the
// scoreboard is visible in the server-rendered HTML - no waiting on
// hydration. The wrapper keeps aria-hidden; acceptable for a disposable
// visual fixture. The fixed z-[100] overlay covers the homepage behind it.

type LegState = "pass" | "pending" | "fail";

// Leg names are Alp's, in his order. States are a hard-coded plausible mix
// so every chip style is visible for review.
const LEGS: Array<{ name: string; state: LegState }> = [
	{ name: "frontier", state: "pass" },
	{ name: "dispatch", state: "pass" },
	{ name: "escalation", state: "fail" },
	{ name: "rejection loop", state: "pass" },
	{ name: "resolve", state: "pass" },
	{ name: "map pointer", state: "pending" },
	{ name: "preview", state: "pending" },
	{ name: "attach", state: "pending" },
];

const CHIP: Record<LegState, string> = {
	pass: "bg-emerald-500 text-white",
	pending: "bg-amber-400 text-slate-900",
	fail: "bg-red-500 text-white",
};

export const Route = createFileRoute("/_layout/curia-check")({
	component: CuriaCheck,
});

function CuriaCheck() {
	return (
		<main
			data-curia-check="true"
			className="fixed inset-0 z-[100] overflow-y-auto bg-white text-slate-900 font-sans"
		>
			<style>{`div[aria-hidden]:has(main[data-curia-check]) { display: block !important; }`}</style>
			<div className="mx-auto max-w-xl px-8 py-24">
				<h1 className="text-3xl font-black uppercase tracking-tighter mb-14">
					Curia Check
				</h1>
				<ul className="border-2 border-slate-900 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.25)] divide-y-2 divide-slate-900">
					{LEGS.map((leg) => (
						<li
							key={leg.name}
							className="flex items-center justify-between gap-8 px-7 py-6"
						>
							<span className="font-bold text-sm uppercase tracking-widest">
								{leg.name}
							</span>
							<span
								className={`px-3 py-1.5 border-2 border-slate-900 font-black text-xs uppercase tracking-widest ${CHIP[leg.state]}`}
							>
								{leg.state}
							</span>
						</li>
					))}
				</ul>
			</div>
		</main>
	);
}
