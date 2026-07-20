/// <reference types="vitest/config" />
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
		test: {
			// Never descend into sibling worktree checkouts (.claude/worktrees/*
			// holds other branches, e.g. research checkouts). Their test files
			// resolve public/ against this repo's cwd, so they falsely couple to
			// the main tree's assets and double-count the suite (wayfinder: forge
			// rename exposed this via a stale research/song-snippet-playback tree).
			exclude: ["**/node_modules/**", "**/dist/**", "**/.claude/worktrees/**"],
			// The DesignPanel suites render the full frame picker (one option per
			// INNER_ORDER entry × 10 topic rows), which legitimately grows with
			// every identity walk - vitest's 5s default started flaking under
			// parallel load once the picker passed ~30 frames (wayfinder #15);
			// 15s started flaking at 52 frames (wayfinder #20).
			testTimeout: 30_000,
		},
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
