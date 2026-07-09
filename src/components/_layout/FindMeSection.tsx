import { SECTION_IDS } from "../../data/sections";
import { ShortsCarousel } from "./social/ShortsCarousel";
import { SOCIAL_GROUPS, type SocialLinkData } from "./social/socialLinks";

function SocialChip({
	label,
	href,
	Icon,
	tint,
	brand,
	hoverBg,
	isNight,
}: SocialLinkData & { isNight: boolean }) {
	const body = (
		<>
			<span
				style={
					{ "--icon-c": isNight ? "#f8fafc" : brand } as React.CSSProperties
				}
				className="flex items-center justify-center shrink-0 transition-colors duration-200 text-[var(--icon-c)] group-hover:text-white"
			>
				<Icon size={28} color="currentColor" />
			</span>
			<span>{label}</span>
		</>
	);

	const style = {
		"--btn-tint": isNight ? `color-mix(in srgb, ${brand} 22%, #0f172a)` : tint,
		"--btn-tint-hover": hoverBg ?? brand,
		"--btn-text-hover": "#ffffff",
	} as React.CSSProperties;

	const className = `btn-brutalist btn-brutalist--chip inline-flex items-center gap-3 font-black uppercase tracking-wider group${
		isNight ? " btn-brutalist--night" : ""
	}`;

	if (href) {
		return (
			<a
				href={href}
				target="_blank"
				rel="noopener noreferrer"
				style={style}
				className={className}
			>
				{body}
			</a>
		);
	}

	return (
		<button
			type="button"
			disabled
			aria-disabled="true"
			title="Coming soon"
			style={style}
			className={className}
		>
			{body}
		</button>
	);
}

export function FindMeSection({ isNight }: { isNight: boolean }) {
	return (
		<section
			id={SECTION_IDS.findMe}
			className="pt-4 pb-64 px-6 relative overflow-hidden text-slate-900"
		>
			<div className="max-w-xl mx-auto relative z-10">
				<div className="text-center mb-12">
					<h2 className="text-4xl md:text-6xl font-black mb-4 uppercase tracking-tighter drop-shadow-[4px_4px_0px_rgba(255,255,255,0.5)]">
						Find Me Online
					</h2>
					<p className="plate text-base font-bold opacity-90 bg-white/40 backdrop-blur-md px-4 py-2 border-l-4 border-slate-900 inline-block">
						Pick a platform. I'm here, posting, shipping, replying.
					</p>
				</div>

				<ShortsCarousel isNight={isNight} />

				<div className="space-y-10">
					{SOCIAL_GROUPS.map((group) => (
						<div key={group.title}>
							<div className="flex items-center gap-3 mb-4">
								<group.Icon size={20} />
								<h3 className="text-xs font-black uppercase tracking-[0.3em] opacity-70">
									{group.title}
								</h3>
								<div className="flex-1 h-px bg-slate-900/20" />
							</div>
							<div className="flex flex-wrap gap-2">
								{group.links.map((link) => (
									<SocialChip key={link.label} {...link} isNight={isNight} />
								))}
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
