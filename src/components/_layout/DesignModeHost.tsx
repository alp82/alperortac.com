import { useEffect, useRef, useState } from "react";
import "./composer/composer.css";
import {
	type ComposerState,
	useComposerControls,
} from "./composer/useComposerControls";
import { DesignPanel } from "./DesignPanel";

/*
 * Composer host — ships to production.
 *
 * The composed look is the default layout, and this host stays mounted so the
 * design can be tweaked live (incl. the baseline toggle). It owns the
 * composition state, renders the floating trigger + the modal panel, and lifts
 * the full ComposerState up to LayoutHost via `onComposer` so the interests band
 * re-renders without LayoutHost importing the hook.
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
		setInner,
		setAllInners,
		setLink,
		patchInnerParams,
		patchAllInnerParams,
		patchLinkParams,
		reset,
	} = useComposerControls();
	const [open, setOpen] = useState(false);
	const dialogRef = useRef<HTMLDialogElement>(null);

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
				aria-label="Open design composer panel"
				title="Design composer"
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
					setInner={setInner}
					setAllInners={setAllInners}
					setLink={setLink}
					patchInnerParams={patchInnerParams}
					patchAllInnerParams={patchAllInnerParams}
					patchLinkParams={patchLinkParams}
					reset={reset}
					onClose={() => setOpen(false)}
				/>
			</dialog>
		</>
	);
}
