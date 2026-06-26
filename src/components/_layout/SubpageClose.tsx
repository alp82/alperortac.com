import { ArrowLeft, X } from "lucide-react";

// Viewport-pinned header controls for the scrollable detail subpages. Rendered
// INSIDE each panel's dialog (so they stay in the dialog's focus trap and tab
// order) but `position: fixed` so they never scroll away on a long subpage —
// always reachable in the header band. While a subpage is open the nav's center
// items + Follow Me are hidden (styles.css), so these stand in: a centered Back
// button and the close X at the top-right where Follow Me used to sit. Esc and
// click-out (the empty landscape) are the other two dismissal paths, wired in
// PanelHost.
export function SubpageClose({ onClose }: { onClose: () => void }) {
	return (
		<>
			<button
				type="button"
				onClick={onClose}
				aria-label="Back to main"
				className="fixed top-3 left-1/2 -translate-x-1/2 z-50 inline-flex items-center justify-center gap-3 min-h-[44px] px-10 w-[min(20rem,60vw)] bg-slate-900 text-white border-2 border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] font-black uppercase text-sm tracking-widest hover:-translate-y-0.5 transition-transform"
			>
				<ArrowLeft size={18} strokeWidth={3} aria-hidden="true" />
				Back to main
			</button>
			<button
				type="button"
				onClick={onClose}
				aria-label="Close"
				className="fixed top-3 right-6 z-50 grid place-items-center bg-white text-slate-900 w-11 h-11 border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 transition-transform"
			>
				<X size={18} aria-hidden="true" />
			</button>
		</>
	);
}
