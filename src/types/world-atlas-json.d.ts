// Ambient declaration for the world-atlas topology JSON so `tsc --noEmit`
// accepts the dynamic import WITHOUT enabling `resolveJsonModule` (which would
// parse the ~800 kB JSON on every typecheck). The default export is typed
// `unknown`; worldData.ts casts it to the topojson `Topology` type.
declare module "world-atlas/countries-50m.json" {
	const topology: unknown;
	export default topology;
}

// The low-detail sibling: the SVG fallback globe re-projects every vertex per
// drag frame, so it loads this ~10x smaller topology instead (worldData.ts).
declare module "world-atlas/countries-110m.json" {
	const topology: unknown;
	export default topology;
}
