/**
 * Honest-liar progress bar.
 *
 * Width is driven entirely by the `--progress` CSS custom property
 * written by `useScrollDriver`. The component itself never reads the
 * variable, so SSR/CSR markup is identical.
 *
 * `aria-valuenow` is updated as a render-side-effect by `useScrollDriver`
 * via `[data-progressbar]`, which keeps the hydration invariant intact.
 */
export function ProgressBar(): React.ReactElement {
	return (
		<div
			role="progressbar"
			aria-label="Page descent progress"
			aria-valuemin={0}
			aria-valuemax={90}
			aria-valuenow={0}
			data-progressbar
			className="fixed inset-x-0 top-0 z-50 h-[3px] w-full bg-black/20 backdrop-blur-[1px]"
		>
			<div className="progress-fill h-full" />
		</div>
	);
}
