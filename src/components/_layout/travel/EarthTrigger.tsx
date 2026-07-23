import { ArrowRight } from "lucide-react";
import { useTriggerNav } from "../composer/useTriggerNav";
import { EarthGlobe } from "./EarthGlobe";

/*
 * The travel band's subpage trigger: a clickable rotating preview earth.
 * The spinning globe IS the tap-target into /travel (the interactive globe
 * subpage, #21) - the PosterGrid pattern of "the media is the trigger".
 *
 * The rotation is pure CSS: a circle clipping a repeating equirectangular
 * texture (NASA blue marble, #37's walk winner over a static satellite shot
 * and a live mini-Mapbox) whose background-position loops one full map width.
 * Inset shadows fake the sphere's terminator + limb light. Reduced-motion
 * pins the spin (styles.css).
 */
export function EarthTrigger({
	lastTriggerRef,
}: {
	lastTriggerRef: React.RefObject<HTMLElement | null>;
}) {
	const { resolveTrigger } = useTriggerNav(lastTriggerRef);
	// Never null for a personal trigger - the resolver's project branch makes
	// its type nullable (PosterGrid precedent).
	const resolved = resolveTrigger({ kind: "personal", slug: "travel" }, "");
	if (!resolved) return null;

	return (
		<button
			type="button"
			onClick={(e) => resolved.navigate(e.currentTarget)}
			data-dive-trigger=""
			data-dive-side="right"
			aria-label="Explore the travel globe"
			className="earth-trigger group mx-auto mt-8 flex flex-col items-center gap-4 cursor-pointer"
		>
			<EarthGlobe />
			<span className="flex items-center gap-2 font-black uppercase tracking-tighter text-xl md:text-2xl">
				Explore the globe
				<ArrowRight
					size={24}
					className="shrink-0 transition-transform group-hover:translate-x-1"
				/>
			</span>
		</button>
	);
}
