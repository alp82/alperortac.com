/*
 * webglSupport.ts (#travel-globe-subpage) - decides whether the WebGL Mapbox GL
 * renderer can run. The `nogl` query param (presence-checked, the documented
 * `&nogl=1` escape hatch) forces the SVG fallback; otherwise probe for a real
 * WebGL2/WebGL canvas context, never throwing even if the probe itself throws.
 */
export function webglAvailable(search: string): boolean {
	const params = new URLSearchParams(search);
	if (params.has("nogl")) return false;
	try {
		const canvas = document.createElement("canvas");
		return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
	} catch {
		return false;
	}
}
