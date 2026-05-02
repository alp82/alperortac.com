import { resolve, sep } from "node:path";
import server from "./dist/server/server.js";

const CLIENT_DIR = resolve("./dist/client");

Bun.serve({
	port: Number(process.env.PORT ?? 3000),
	hostname: "0.0.0.0",
	async fetch(req) {
		const url = new URL(req.url);
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
