import { useEffect, useRef, useState } from "react";
// Composer CSS as a raw string (Vite `?raw`), injected at runtime instead of as
// a stylesheet side-effect — see the injection effect below. This keeps the
// styles out of every production CSS asset.
import composerCss from "./composer/composer.css?raw";
import {
	type ComposerState,
	useComposerControls,
} from "./composer/useComposerControls";
import { DesignPanel } from "./DesignPanel";

/*
 * DEV-ONLY composer host.
 *
 * Self-contained so production builds dead-strip it: LayoutHost renders
 * <DesignModeHost> only behind a folded `import.meta.env.DEV` literal, and this
 * is the ONLY module that imports the panel + the useComposerControls hook +
 * (transitively) the composer registries. With the render site dead in prod,
 * Rollup tree-shakes this file and its transitive imports out of the client
 * bundle entirely.
 *
 * It owns the composition state, renders the floating trigger + the modal
 * panel, and lifts the full ComposerState up to LayoutHost via `onComposer` so
 * the interests band re-renders without LayoutHost importing the hook.
 *
 * Planner: delete this file with the rest of the design-exploration host
 * (see CLEANUP_NEEDED).
 */

type DesignModeHostProps = {
	lastTriggerRef: React.RefObject<HTMLElement | null>;
	onComposer: (state: ComposerState) => void;
};

export function DesignModeHost({
	lastTriggerRef,
	onComposer,
}: DesignModeHostProps) {
	const {
		state,
		setBaseline,
		setSection,
		setInner,
		setLink,
		patchSectionParams,
		patchInnerParams,
		patchLinkParams,
		reset,
	} = useComposerControls();
	const [open, setOpen] = useState(false);
	const dialogRef = useRef<HTMLDialogElement>(null);

	// Inject the DEV-only composer CSS at runtime. Imported as a raw JS string
	// (Vite `?raw`), NOT as a CSS side-effect, so it never lands in any prod CSS
	// asset; it lives inside this module's JS, and since the whole DEV host
	// dead-strips in production the string goes with it. Inject once on mount,
	// remove on unmount (HMR-safe via a stable id).
	useEffect(() => {
		const STYLE_ID = "design-composer-styles";
		if (document.getElementById(STYLE_ID)) return;
		const el = document.createElement("style");
		el.id = STYLE_ID;
		el.textContent = composerCss;
		document.head.appendChild(el);
		return () => {
			el.remove();
		};
	}, []);

	// Lift the composition up to LayoutHost whenever it changes.
	useEffect(() => {
		onComposer(state);
	}, [state, onComposer]);

	// Drive the <dialog> open/close imperatively (matches PanelHost idiom).
	useEffect(() => {
		const dialog = dialogRef.current;
		if (!dialog) return;
		if (open && !dialog.open) dialog.showModal();
		else if (!open && dialog.open) dialog.close();
	}, [open]);

	// ESC / backdrop close + focus return to the trigger.
	useEffect(() => {
		const dialog = dialogRef.current;
		if (!dialog) return;
		const onCloseEvt = () => {
			setOpen(false);
			const trigger = lastTriggerRef.current;
			if (trigger && document.body.contains(trigger)) trigger.focus();
		};
		const onClick = (e: MouseEvent) => {
			if (e.target === dialog) dialog.close();
		};
		dialog.addEventListener("close", onCloseEvt);
		dialog.addEventListener("click", onClick);
		return () => {
			dialog.removeEventListener("close", onCloseEvt);
			dialog.removeEventListener("click", onClick);
		};
	}, [lastTriggerRef]);

	return (
		<>
			<button
				type="button"
				onClick={(e) => {
					lastTriggerRef.current = e.currentTarget;
					setOpen(true);
				}}
				aria-label="Open design composer panel (dev only)"
				title="DEV-only design composer"
				className="fixed bottom-4 right-4 md:right-24 z-50 bg-slate-900 text-white min-h-[44px] px-3 py-3 border-2 border-dashed border-amber-300 shadow-[4px_4px_0px_0px_rgba(253,224,71,0.5)] font-black uppercase text-xs tracking-widest hover:-translate-y-0.5 transition-transform"
			>
				Design 🎨
			</button>

			<dialog
				ref={dialogRef}
				aria-labelledby="design-panel-title"
				className="panel-dialog-modal panel-dialog-modal--right"
				style={
					{
						"--panel-bg": "#ffffff",
						"--panel-fg": "#0f172a",
					} as React.CSSProperties
				}
			>
				<DesignPanel
					state={state}
					setBaseline={setBaseline}
					setSection={setSection}
					setInner={setInner}
					setLink={setLink}
					patchSectionParams={patchSectionParams}
					patchInnerParams={patchInnerParams}
					patchLinkParams={patchLinkParams}
					reset={reset}
					onClose={() => setOpen(false)}
				/>
			</dialog>
		</>
	);
}
