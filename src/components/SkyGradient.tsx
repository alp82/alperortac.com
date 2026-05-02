/**
 * Fixed full-viewport background that interpolates day -> dusk -> night
 * as the user scrolls. The actual gradient math lives in `styles.css`
 * (`.sky-gradient`) and reads `--scroll` from `:root`.
 *
 * Render output is identical SSR vs client - the component never reads
 * the `--scroll` variable. This keeps hydration safe.
 */
export function SkyGradient(): React.ReactElement {
	return (
		<div
			aria-hidden="true"
			className="sky-gradient pointer-events-none fixed inset-0 z-0"
		/>
	);
}
