import type { Story } from "../data/stories";
import { SubpageClose } from "./_layout/SubpageClose";

export const EARLY_DAYS_PANEL_TITLE_ID = "early-days-title";
export const getStoryPanelTitleId = (slug: string) => `story-${slug}-title`;

type EarlyDaysPanelProps = {
	story: Story;
	onClose: () => void;
};

export function EarlyDaysPanel({ story, onClose }: EarlyDaysPanelProps) {
	const Icon = story.Icon;

	return (
		<>
			<SubpageClose onClose={onClose} />
			<div
				className="subpage-column relative w-full max-w-3xl mx-auto my-[10vh]"
				style={{ color: story.panelFg }}
			>
				<div className="px-6 md:px-10 py-12">
					<div
						className={`w-24 h-24 mb-6 flex items-center justify-center border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(255,255,255,0.25)] ${story.tileBg} ${story.tileFg}`}
					>
						<Icon size={48} />
					</div>

					<h2
						id={getStoryPanelTitleId(story.slug)}
						className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-8"
					>
						{story.title}
					</h2>

					<div className="space-y-5 text-lg md:text-xl leading-relaxed">
						<p>
							I started coding with QBasic when I was 12. Built text adventures
							and generated PC speaker sounds. Then started to do a little bit
							of graphics with Turbo Pascal. Tried Delphi. Started to learn HTML
							and CSS when I was 16 and found my love for web development.
						</p>
						<p>
							Was admin in a forum for my friends, we chatted via IRC and later
							ICQ. Also gaming and LAN-parties. Lots of gaming. My digital life
							has begun.
						</p>
					</div>
				</div>
			</div>
		</>
	);
}
