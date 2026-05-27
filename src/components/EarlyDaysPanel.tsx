import { ArrowLeft } from "lucide-react";
import type { Story } from "../data/stories";
import { PANEL_SIDES } from "../data/sections";

export const EARLY_DAYS_PANEL_TITLE_ID = "early-days-title";

type EarlyDaysPanelProps = {
	story: Story;
	onClose: () => void;
};

export function EarlyDaysPanel({ story, onClose }: EarlyDaysPanelProps) {
	const Icon = story.Icon;
	const side = PANEL_SIDES[story.slug];
	const railRight = side !== "right";

	return (
		<div
			className="relative w-full h-full overflow-y-auto"
			style={{ color: story.panelFg }}
		>
			<button
				type="button"
				onClick={onClose}
				aria-label="Return to main path"
				className={`absolute ${railRight ? "right-0 border-l-2" : "left-0 border-r-2"} top-0 h-full w-12 bg-slate-100 text-slate-900 font-black uppercase tracking-widest text-xs flex items-center justify-center border-slate-900 hover:bg-white transition-colors z-20`}
				style={{ writingMode: "vertical-rl" }}
			>
				Return
			</button>

			<button
				type="button"
				onClick={onClose}
				aria-label="Return to main path"
				className="absolute top-4 left-4 z-20 bg-slate-100 text-slate-900 min-h-[44px] px-3 py-3 border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.4)] font-black uppercase text-xs tracking-widest hover:-translate-y-0.5 transition-transform flex items-center gap-2"
			>
				<ArrowLeft size={14} aria-hidden="true" /> Main Path
			</button>

			<div
				className={`${railRight ? "pl-6 pr-20" : "pl-20 pr-6"} pt-24 pb-16 max-w-4xl mx-auto`}
			>
				<div
					className={`w-24 h-24 mb-6 flex items-center justify-center border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(255,255,255,0.25)] ${story.tileBg} ${story.tileFg}`}
				>
					<Icon size={48} />
				</div>

				<h2
					id={EARLY_DAYS_PANEL_TITLE_ID}
					className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-8"
				>
					{story.title}
				</h2>

				<div className="space-y-5 text-lg md:text-xl leading-relaxed">
					<p>
						I started coding with QBasic when I was 12. Built text adventures
						and generated PC speaker sounds. Then started to do a little bit of
						graphics with Turbo Pascal. Tried Delphi. Started to learn HTML and
						CSS when I was 16 and found my love for web development.
					</p>
					<p>
						Was admin in a forum for my friends, we chatted via IRC and later
						ICQ. Also gaming and LAN-parties. Lots of gaming. My digital life
						has begun.
					</p>
				</div>
			</div>
		</div>
	);
}
