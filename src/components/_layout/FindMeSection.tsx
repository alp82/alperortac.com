import { useRef } from "react";
import { SECTION_IDS } from "../../data/sections";
import { SectionTitle, useSectionNightPhase } from "./SectionTitle";
import { ShortsCarousel } from "./social/ShortsCarousel";
import { SOCIAL_GROUPS, type SocialLinkData } from "./social/socialLinks";

const FIND_ME_ACCENT = "#334155";

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

export function FindMeSection() {
	const sectionRef = useRef<HTMLElement>(null);
	// ONE frozen phase for the whole section, measured at the section root:
	// the heading, every chip, and the scrollbar must all agree. The title
	// takes this phase via its `night` override rather than self-measuring —
	// the section is ~1500-2000px tall, so title-center vs section-center
	// differ by ~0.1 progress.
	const night = useSectionNightPhase(sectionRef);
	return (
		<section
			ref={sectionRef}
			id={SECTION_IDS.findMe}
			className="pt-4 pb-64 px-6 relative overflow-hidden text-slate-900"
		>
			{/* 632px = exactly 3 shorts in the rail: 3*196 card + 2*16 gap + 2*6 track padding */}
			<div className="max-w-[632px] mx-auto relative z-10">
				<div className="text-center mb-12">
					<SectionTitle className="mb-4" accent={FIND_ME_ACCENT} night={night}>
						Find Me
					</SectionTitle>
				</div>

				<ShortsCarousel isNight={night} />

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
									<SocialChip key={link.label} {...link} isNight={night} />
								))}
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
