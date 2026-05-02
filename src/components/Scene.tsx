import { useScrollDriver } from "../hooks/useScrollDriver";
import { Clouds } from "./Clouds";
import { DigZone } from "./DigZone";
import { Landscape } from "./Landscape";
import { ProgressBar } from "./ProgressBar";
import { SkyGradient } from "./SkyGradient";
import { Sun } from "./Sun";

/**
 * Top-level layout for the single vertical-scroll page.
 *
 * Three parallax depths plus content:
 *   far: clouds                                       (factor 0.15)
 *   mid: mountains, river, canopy, trunks, floor      (factor 0.5)
 *   content: in-flow text + dig zone                  (factor 1.0)
 *
 * The sun glow is fixed-viewport with its own scroll-driven gradient
 * centre and lives between the sky and the clouds.
 *
 * z-index ladder (locked):
 *   - SkyGradient:           z-0
 *   - Sun glow:              z-5
 *   - Clouds:                z-10
 *   - Landscape (mid):       z-25
 *   - Content sections:      z-30
 *   - ProgressBar:           z-50
 */
export function Scene(): React.ReactElement {
	useScrollDriver();

	return (
		<>
			<SkyGradient />
			<Sun />
			<Clouds />
			<Landscape />
			<ProgressBar />

			<main className="relative z-30 flex flex-col">
				{/* 1. Hero - high day. */}
				<section className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
					<h1 className="text-scroll-adaptive text-5xl font-semibold tracking-tight sm:text-7xl">
						Alper Ortac
					</h1>
					<p className="text-scroll-adaptive mt-4 max-w-md text-base font-medium sm:text-lg">
						Scroll downward through atmosphere, time, and depth.
					</p>
				</section>

				{/* 2. Sky -> mountains begin to enter. */}
				<section className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
					<h2 className="text-scroll-adaptive text-3xl font-semibold sm:text-4xl">
						Linktree placeholder
					</h2>
					<p className="text-scroll-adaptive mt-3 max-w-md text-sm font-medium sm:text-base">
						Social and platform links will drift here.
					</p>
				</section>

				{/* 3. Mountains, spring opening into river. */}
				<section className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
					<h2 className="text-scroll-adaptive text-3xl font-semibold sm:text-4xl">
						Career & projects placeholder
					</h2>
					<p className="text-scroll-adaptive mt-3 max-w-md text-sm font-medium sm:text-base">
						Tangible objects in a softly abstract setting - feel, not literal.
					</p>
				</section>

				{/* 4. Treetops, dusk approaches. */}
				<section className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
					<h2 className="text-scroll-adaptive text-3xl font-semibold sm:text-4xl">
						Approaching the underground
					</h2>
					<p className="text-scroll-adaptive mt-3 max-w-md text-sm font-medium sm:text-base">
						Depth requires effort, not just scrolling.
					</p>
				</section>

				{/* 5. Full-section dig: the soil takes the whole viewport. */}
				<section className="relative min-h-screen">
					<DigZone />
				</section>
			</main>
		</>
	);
}
