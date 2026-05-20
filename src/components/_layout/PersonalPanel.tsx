import { ArrowLeft } from "lucide-react";
import type { Personal } from "../../data/personal";
import { PANEL_SIDES } from "../../data/sections";

export const getPersonalPanelTitleId = (slug: string) =>
	`personal-${slug}-title`;

type PersonalPanelProps = {
	item: Personal;
	teaser: string;
	onClose: () => void;
};

export function PersonalPanel({ item, teaser, onClose }: PersonalPanelProps) {
	const Icon = item.Icon;
	const titleId = getPersonalPanelTitleId(item.slug);
	const side = PANEL_SIDES[item.slug];
	const railRight = side !== "right";

	return (
		<div
			className="relative w-full h-full overflow-y-auto"
			style={{ color: item.panelFg }}
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
					className={`w-24 h-24 mb-6 flex items-center justify-center border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(255,255,255,0.25)] ${item.tileBg} ${item.tileFg}`}
				>
					<Icon size={48} />
				</div>

				<h2
					id={titleId}
					className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-2"
				>
					{item.title}
				</h2>

				<PlaceholderBanner />

				<p
					className="mt-6 text-lg leading-relaxed"
					style={{ color: item.panelFg }}
				>
					{teaser}
				</p>
			</div>
		</div>
	);
}

export function PlaceholderBanner({
	text = "PLACEHOLDER — content coming soon",
}: {
	text?: string;
}) {
	return (
		<div className="mb-10 bg-yellow-300 text-slate-900 border-4 border-slate-900 p-4 font-black uppercase tracking-widest text-xs md:text-sm shadow-[6px_6px_0px_0px_rgba(255,255,255,0.25)]">
			{text}
		</div>
	);
}
