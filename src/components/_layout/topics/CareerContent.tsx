import { CAREER_TIMELINE } from "../../../data/career";
import { CAREER_TEASER } from "../../../data/topics";
import { Paragraph, type TopicContentProps } from "./primitives";

export function CareerContent({ accent }: TopicContentProps) {
	return (
		<div className="flex flex-col items-center space-y-5">
			{CAREER_TEASER.split("\n\n").map((para) => (
				<Paragraph key={para.slice(0, 24)}>{para}</Paragraph>
			))}
			<ol className="mt-8 space-y-10 max-w-lg">
				{CAREER_TIMELINE.map((entry) => (
					<li
						key={`${entry.year}-${entry.role}`}
						className="relative pl-8 border-l-2"
						style={{
							borderColor: `color-mix(in srgb, ${accent} 55%, transparent)`,
						}}
					>
						<span
							aria-hidden="true"
							className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full"
							style={{ backgroundColor: accent }}
						/>
						<div
							className="inline-block text-[11px] font-black uppercase tracking-widest px-2 py-0.5 mb-2 text-slate-900"
							style={{ backgroundColor: accent }}
						>
							{entry.year}
						</div>
						<h3 className="text-xl md:text-2xl font-black uppercase tracking-tight leading-none mb-1 text-slate-900 [.is-night_&]:text-slate-50">
							{entry.role}
						</h3>
						<div className="text-sm md:text-base font-bold uppercase mb-2 text-slate-600 [.is-night_&]:text-slate-300">
							{entry.company}
						</div>
						<p className="text-base md:text-lg leading-relaxed font-medium mb-3 text-slate-700 [.is-night_&]:text-slate-200">
							{entry.desc}
						</p>
						<ul className="flex flex-wrap gap-1.5">
							{entry.stack.map((tech) => (
								<li
									key={tech}
									className="text-[11px] font-black uppercase tracking-wider px-2 py-0.5 border-2 border-slate-900/60 text-slate-700 [.is-night_&]:border-white/40 [.is-night_&]:text-slate-200"
								>
									{tech}
								</li>
							))}
						</ul>
					</li>
				))}
			</ol>
		</div>
	);
}
