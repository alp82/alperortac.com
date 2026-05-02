import { useScrollDriver } from "../hooks/useScrollDriver";
import { Clouds } from "./Clouds";
import { DigZone } from "./DigZone";
import { ProgressBar } from "./ProgressBar";
import { SkyGradient } from "./SkyGradient";

/**
 * Top-level layout for the single vertical-scroll page.
 *
 * z-index ladder (locked):
 *   - SkyGradient: z-0  (fixed background)
 *   - Clouds:      z-10 (fixed decorative)
 *   - Scene rows:  z-20 (in-flow)
 *   - ProgressBar: z-50 (fixed UI)
 *
 * Scroll-driven CSS variables are written by `useScrollDriver`. Render
 * code never reads them - that's the hydration invariant.
 */
export function Scene(): React.ReactElement {
	useScrollDriver();

	return (
		<>
			<SkyGradient />
			<Clouds />
			<ProgressBar />

			<main className="relative z-20 flex flex-col">
				{/* 1. Hero - sky / day. */}
				<section className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
					<h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
						Alper Ortac
					</h1>
					<p className="mt-4 max-w-md text-base opacity-80 sm:text-lg">
						Scroll downward through atmosphere, time, and depth.
					</p>
				</section>

				{/* 2. Sky -> dusk transition filler. */}
				<section className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
					<h2 className="text-2xl font-medium opacity-90 sm:text-3xl">
						Linktree placeholder
					</h2>
					<p className="mt-3 max-w-md text-sm opacity-70 sm:text-base">
						Social and platform links will drift here.
					</p>
				</section>

				{/* 3. Dusk - career / freelance. */}
				<section className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
					<h2 className="text-2xl font-medium opacity-90 sm:text-3xl">
						Career & projects placeholder
					</h2>
					<p className="mt-3 max-w-md text-sm opacity-70 sm:text-base">
						Tangible objects in a softly abstract setting - feel, not literal.
					</p>
				</section>

				{/* 4. Approaching night. */}
				<section className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
					<h2 className="text-2xl font-medium opacity-90 sm:text-3xl">
						Approaching the underground
					</h2>
					<p className="mt-3 max-w-md text-sm opacity-70 sm:text-base">
						Depth requires effort, not just scrolling.
					</p>
				</section>

				{/* 5. Underground - dig zone. */}
				<section className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
					<h2 className="text-2xl font-medium sm:text-3xl">Dig to reveal</h2>
					<p className="max-w-md text-sm opacity-80 sm:text-base">
						Drag across the soil to clear it.
					</p>
					<DigZone />
				</section>
			</main>
		</>
	);
}
