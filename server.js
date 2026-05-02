import { resolve, sep } from "node:path";
import server from "./dist/server/server.js";

const CLIENT_DIR = resolve("./dist/client");

const POSTHOG_HOST =
	process.env.VITE_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";
const POSTHOG_ASSETS_HOST = POSTHOG_HOST.replace(
	/^(https?:\/\/)([^.]+)(\.i\.posthog\.com)/,
	"$1$2-assets$3",
);

async function proxyToPostHog(req, url) {
	const isAssets =
		url.pathname.startsWith("/ingest/static") ||
		url.pathname.startsWith("/ingest/array");
	const target = isAssets ? POSTHOG_ASSETS_HOST : POSTHOG_HOST;
	const targetUrl = new URL(
		url.pathname.replace(/^\/ingest/, "") + url.search,
		target,
	);
	const headers = new Headers(req.headers);
	headers.set("host", targetUrl.host);
	headers.delete("accept-encoding");
	const upstream = await fetch(targetUrl, {
		method: req.method,
		headers,
		body:
			req.method === "GET" || req.method === "HEAD" ? undefined : req.body,
		redirect: "manual",
	});
	const responseHeaders = new Headers(upstream.headers);
	responseHeaders.delete("content-encoding");
	responseHeaders.delete("content-length");
	responseHeaders.delete("transfer-encoding");
	return new Response(upstream.body, {
		status: upstream.status,
		statusText: upstream.statusText,
		headers: responseHeaders,
	});
}

Bun.serve({
	port: Number(process.env.PORT ?? 3000),
	hostname: "0.0.0.0",
	async fetch(req) {
		const url = new URL(req.url);
		if (url.pathname.startsWith("/ingest/") || url.pathname === "/ingest") {
			return proxyToPostHog(req, url);
		}
		if (url.pathname !== "/" && !url.pathname.endsWith("/")) {
			const filePath = resolve(CLIENT_DIR, `.${url.pathname}`);
			if (filePath.startsWith(CLIENT_DIR + sep)) {
				const file = Bun.file(filePath);
				if (await file.exists()) return new Response(file);
			}
		}
		return server.fetch(req);
	},
});
