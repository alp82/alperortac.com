// Ambient declaration for the world-atlas topology JSON so `tsc --noEmit`
// accepts the dynamic import WITHOUT enabling `resolveJsonModule` (which would
// parse the ~800 kB JSON on every typecheck). The default export is typed
// `unknown`; worldData.ts casts it to the topojson `Topology` type.
declare module "world-atlas/countries-50m.json" {
	const topology: unknown;
	export default topology;
}
