import { SECTION_IDS } from "../../data/sections";

export function HeroSection() {
	return (
		<section
			id={SECTION_IDS.start}
			className="min-h-[70vh] flex flex-col items-center justify-center px-6 pt-24 pb-4 text-center"
		>
			<img
				src="/alper-avatar.webp"
				alt="Alp portrait"
				className="w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] mb-8 object-cover"
			/>
			<h1 className="text-6xl md:text-8xl font-black mb-6 leading-[0.9] tracking-tighter drop-shadow-sm text-slate-900">
				HEY, I'M ALPER.
			</h1>
			<p className="plate hero-plate text-xl md:text-2xl text-slate-800 max-w-lg font-medium leading-relaxed bg-white/40 backdrop-blur-md p-4 border-l-4 border-slate-900 shadow-sm">
				<strong>Web enthusiast</strong> and <strong>agentic coach</strong>,<br />
				with a side project habit and a camera.
			</p>
		</section>
	);
}
