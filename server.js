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
	headers.delete("host");
	headers.delete("accept-encoding");
	headers.delete("content-length");
	const body =
		req.method === "GET" || req.method === "HEAD"
			? undefined
			: await req.arrayBuffer();
	const upstream = await fetch(targetUrl, {
		method: req.method,
		headers,
		body,
		redirect: "manual",
	});
	console.log(
		`[upstream] ${req.method} ${url.pathname} -> ${targetUrl.host}${targetUrl.pathname} ${upstream.status} (body: ${body?.byteLength ?? 0}B)`,
	);
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

async function handle(req) {
	const url = new URL(req.url);
	if (url.pathname.startsWith("/ingest/") || url.pathname === "/ingest") {
		return { res: await proxyToPostHog(req, url), kind: "ingest" };
	}
	if (url.pathname !== "/" && !url.pathname.endsWith("/")) {
		const filePath = resolve(CLIENT_DIR, `.${url.pathname}`);
		if (filePath.startsWith(CLIENT_DIR + sep)) {
			const file = Bun.file(filePath);
			if (await file.exists()) return { res: new Response(file), kind: "static" };
		}
	}
	return { res: await server.fetch(req), kind: "ssr" };
}

Bun.serve({
	port: Number(process.env.PORT ?? 3000),
	hostname: "0.0.0.0",
	async fetch(req) {
		const start = performance.now();
		const url = new URL(req.url);
		try {
			const { res, kind } = await handle(req);
			const ms = (performance.now() - start).toFixed(0);
			console.log(
				`[${kind}] ${req.method} ${url.pathname}${url.search} ${res.status} ${ms}ms`,
			);
			return res;
		} catch (err) {
			const ms = (performance.now() - start).toFixed(0);
			console.error(
				`[error] ${req.method} ${url.pathname}${url.search} ${ms}ms`,
				err,
			);
			throw err;
		}
	},
});
