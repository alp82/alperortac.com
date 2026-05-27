import { Mail } from "lucide-react";
import { SECTION_IDS } from "../../data/sections";

export function CTASection() {
	return (
		<section id={SECTION_IDS.cta} className="py-24 px-6">
			<div className="bg-slate-900 text-white border-4 border-slate-900 shadow-[12px_12px_0px_0px_rgba(255,255,255,0.2)] p-10 max-w-3xl mx-auto">
				<h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-4 leading-[0.95]">
					You made it to the night.
				</h2>
				<p className="text-lg opacity-80 mb-8 leading-relaxed">
					If any of this resonated — a project, a passion, a way of thinking —
					drop a line.
				</p>
				<a
					href="mailto:alportac@gmail.com"
					className="inline-flex items-center gap-3 bg-white text-slate-900 px-6 py-4 font-black uppercase text-sm tracking-widest shadow-[6px_6px_0px_0px_rgba(255,255,255,0.4)] hover:-translate-y-1 transition-transform"
				>
					<Mail size={18} />
					alportac@gmail.com
				</a>
			</div>
		</section>
	);
}
