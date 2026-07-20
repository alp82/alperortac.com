import {
	createRouter as createTanStackRouter,
	Link,
} from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

function NotFound() {
	return (
		<main
			style={{ padding: "4rem", fontFamily: "system-ui", textAlign: "center" }}
		>
			<h1>404</h1>
			<p>Nothing hidden here.</p>
			<Link to="/">Back to the start page</Link>
		</main>
	);
}

export function getRouter() {
	const router = createTanStackRouter({
		routeTree,
		// Off deliberately: the pre-hydration sky boot script (src/data/skyBoot.ts)
		// owns cold-entry scroll (it lands the window on the deep-link target before
		// paint), and the browser's native history scroll restoration
		// (history.scrollRestoration stays "auto" when this is false) handles
		// back/forward. With this "true", TanStack also scrolled at hydration -
		// racing the boot land and causing a visible jump. One scroller only.
		scrollRestoration: false,
		defaultPreload: "intent",
		defaultPreloadStaleTime: 0,
		defaultNotFoundComponent: NotFound,
	});

	return router;
}

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof getRouter>;
	}
}
