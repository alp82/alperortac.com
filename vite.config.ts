import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import viteReact from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "");
	const posthogHost = env.VITE_PUBLIC_POSTHOG_HOST ?? "";
	// Derive assets host: https://eu.i.posthog.com -> https://eu-assets.i.posthog.com
	const posthogAssetsHost = posthogHost.replace(
		/^(https?:\/\/)([^.]+)(\.i\.posthog\.com)/,
		"$1$2-assets$3",
	);

	return {
		resolve: { tsconfigPaths: true },
		plugins: [devtools(), tailwindcss(), tanstackStart(), viteReact()],
		server: {
			proxy: {
				"/ingest/static": {
					target: posthogAssetsHost,
					changeOrigin: true,
					rewrite: (path) => path.replace(/^\/ingest/, ""),
					secure: false,
				},
				"/ingest/array": {
					target: posthogAssetsHost,
					changeOrigin: true,
					rewrite: (path) => path.replace(/^\/ingest/, ""),
					secure: false,
				},
				"/ingest": {
					target: posthogHost,
					changeOrigin: true,
					rewrite: (path) => path.replace(/^\/ingest/, ""),
					secure: false,
				},
			},
		},
	};
});
