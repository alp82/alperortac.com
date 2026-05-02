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
		scrollRestoration: true,
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
