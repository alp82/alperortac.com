import { useEffect, useLayoutEffect } from "react";

// useLayoutEffect on the client (runs before the browser paints), degrading to
// a (never-invoked-on-server) useEffect during SSR so React doesn't warn. Use
// it for writes that must land before the first paint - e.g. seeding the sky /
// celestial scene for a cold deep-link so it never flashes the day state.
export const useIsomorphicLayoutEffect =
	typeof window !== "undefined" ? useLayoutEffect : useEffect;
