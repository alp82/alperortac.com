type PlaceholderProps = {
	revealed: boolean;
};

/**
 * The card revealed when the user clears the soil patch.
 *
 * Visibility is driven by a `data-revealed` attribute consumed by
 * `.placeholder-card` styles in `styles.css`. The card lives behind
 * the dig canvas and fades in once the canvas has been cleared
 * past the threshold.
 */
export function Placeholder({
	revealed,
}: PlaceholderProps): React.ReactElement {
	return (
		<div
			className="placeholder-card pointer-events-none absolute inset-0 flex items-center justify-center px-4"
			data-revealed={revealed ? "true" : "false"}
			aria-live="polite"
		>
			<div className="rounded-xl bg-[color:var(--text-on-dark)] px-5 py-4 text-center text-[color:var(--text-on-light)] shadow-lg">
				<p className="text-base font-semibold">Underground content goes here</p>
				<p className="mt-1 text-xs opacity-70">
					Placeholder - real content TBD
				</p>
			</div>
		</div>
	);
}
