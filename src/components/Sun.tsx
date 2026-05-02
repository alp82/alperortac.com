/**
 * Sun glow.
 *
 * Renders a wide radial gradient that brightens the sky region the sun
 * occupies, rather than a discrete disc. The gradient centre tracks
 * `--scroll` along a leftward arc with a (1 - cos) parabolic descent,
 * then fades into night. All motion is CSS-driven; the component never
 * reads any custom property, so SSR and client output match.
 */
export function Sun(): React.ReactElement {
	return <div aria-hidden="true" className="sun-glow" />;
}
