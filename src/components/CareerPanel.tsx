import { ArrowLeft } from "lucide-react";
import { CAREER_TIMELINE } from "../data/career";

export const CAREER_PANEL_TITLE_ID = "career-panel-title";

type CareerPanelProps = {
	onClose: () => void;
};

export function CareerPanel({ onClose }: CareerPanelProps) {
	return (
		<div className="relative w-full h-full overflow-y-auto text-slate-100 bg-slate-800">
			<button
				type="button"
				onClick={onClose}
				aria-label="Return to main path"
				className="absolute right-0 top-0 h-full w-12 bg-slate-100 text-slate-900 font-black uppercase tracking-widest text-xs flex items-center justify-center border-l-2 border-slate-900 hover:bg-white transition-colors z-20"
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

			<div className="pl-6 pr-20 pt-24 pb-16 max-w-4xl mx-auto">
				<h2
					id={CAREER_PANEL_TITLE_ID}
					className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-2"
				>
					Work History
				</h2>
				<p className="text-sm opacity-70 mb-10">
					A short trail of where I have been building.
				</p>

				<div className="relative">
					<div className="absolute left-4 md:left-1/2 md:-translate-x-1/2 top-0 bottom-0 w-0.5 bg-slate-100/40 pointer-events-none" />

					<ol className="space-y-12">
						{CAREER_TIMELINE.map((entry, i) => {
							const sideClass =
								i % 2 === 0
									? "md:pr-[calc(50%+2rem)] md:text-right"
									: "md:pl-[calc(50%+2rem)] md:text-left";
							return (
								<li
									key={`${entry.year}-${entry.role}`}
									className={`relative pl-12 md:pl-0 ${sideClass}`}
								>
									<div className="absolute left-4 md:left-1/2 md:-translate-x-1/2 top-2 w-3 h-3 rounded-full bg-slate-100 border-2 border-slate-900" />
									<div className="bg-slate-100 text-slate-900 border-4 border-slate-100 p-5 shadow-[6px_6px_0px_0px_rgba(255,255,255,0.25)]">
										<div className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">
											{entry.year}
										</div>
										<div className="text-xl font-black uppercase leading-none mb-1">
											{entry.role}
										</div>
										<div className="text-sm font-bold opacity-80 mb-2">
											{entry.company}
										</div>
										<p className="text-sm leading-relaxed mb-3">{entry.desc}</p>
										<ul
											className={`flex flex-wrap gap-1.5 ${i % 2 === 0 ? "md:justify-end" : "md:justify-start"}`}
										>
											{entry.stack.map((tech) => (
												<li
													key={tech}
													className="text-[10px] font-black uppercase tracking-wider px-2 py-1 bg-slate-900 text-slate-100 border-2 border-slate-900"
												>
													{tech}
												</li>
											))}
										</ul>
									</div>
								</li>
							);
						})}
					</ol>
				</div>
			</div>
		</div>
	);
}
