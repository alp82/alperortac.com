import { CAREER_TIMELINE } from "../data/career";
import { SubpageClose } from "./_layout/SubpageClose";

export const CAREER_PANEL_TITLE_ID = "career-panel-title";

type CareerPanelProps = {
	onClose: () => void;
};

export function CareerPanel({ onClose }: CareerPanelProps) {
	return (
		<>
			<SubpageClose onClose={onClose} />
			<div className="subpage-column relative w-full max-w-3xl mx-auto my-[10vh] text-slate-100">
				<div className="px-6 md:px-10 py-12">
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
										<div className="bg-white/5 text-slate-100 border-4 border-white/15 p-5 shadow-[6px_6px_0px_0px_rgba(255,255,255,0.12)]">
											<div className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">
												{entry.year}
											</div>
											<div className="text-xl font-black uppercase leading-none mb-1">
												{entry.role}
											</div>
											<div className="text-sm font-bold opacity-80 mb-2">
												{entry.company}
											</div>
											<p className="text-sm leading-relaxed mb-3">
												{entry.desc}
											</p>
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
		</>
	);
}
