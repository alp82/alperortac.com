import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

// Throwaway test fixture for the curia golden-thread run (#67). A later
// ticket deletes this page. Hard-coded data by design - no data source.
//
// The _layout Outlet renders inside display:none (subpage content normally
// arrives via PanelHost), so this page portals its scoreboard to
// document.body to be visible. Client-only: the portal mounts after
// hydration.

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
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);
	if (!mounted) return null;

	return createPortal(
		<div className="fixed inset-0 z-[100] overflow-y-auto bg-white text-slate-900 font-sans">
			<main className="mx-auto max-w-xl px-6 py-16">
				<h1 className="text-3xl font-black uppercase tracking-tighter mb-8">
					Curia Check
				</h1>
				<ul className="border-2 border-slate-900 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.25)] divide-y-2 divide-slate-900">
					{LEGS.map((leg) => (
						<li
							key={leg.name}
							className="flex items-center justify-between gap-4 px-4 py-3"
						>
							<span className="font-bold text-sm uppercase tracking-widest">
								{leg.name}
							</span>
							<span
								className={`px-2 py-1 border-2 border-slate-900 font-black text-xs uppercase tracking-widest ${CHIP[leg.state]}`}
							>
								{leg.state}
							</span>
						</li>
					))}
				</ul>
			</main>
		</div>,
		document.body,
	);
}
