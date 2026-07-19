/*
 * The rotating pixel earth - a pure-CSS sphere clipping the repeating
 * equirectangular texture (styles.css `.earth-globe`). Decorative on its own;
 * EarthTrigger wraps it as the band's tap-target, PersonalPanel shows it large
 * on /travel until the interactive globe lands (#21).
 */
export function EarthGlobe({
	size,
	className = "",
}: {
	/** CSS length driving diameter + texture wrap; defaults to 8rem. */
	size?: string;
	className?: string;
}) {
	return (
		<span
			className={`earth-globe ${className}`}
			style={
				size ? ({ "--earth-size": size } as React.CSSProperties) : undefined
			}
			aria-hidden="true"
		/>
	);
}
