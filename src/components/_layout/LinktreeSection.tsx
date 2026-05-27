import {
	SiBluesky,
	SiGithub,
	SiInstagram,
	SiThreads,
	SiTiktok,
	SiX,
	SiYoutube,
} from "@icons-pack/react-simple-icons";
import { ArrowRight, Briefcase, MessageCircle, Video } from "lucide-react";
import { SECTION_IDS } from "../../data/sections";

type BrandIcon = React.ComponentType<{
	size?: number;
	color?: string;
	className?: string;
}>;

// LinkedIn was removed from Simple Icons and Lucide over trademark requests;
// nominative-use glyph for linking out to a profile.
function SiLinkedin({
	size = 24,
	color = "default",
	className,
}: {
	size?: number;
	color?: string;
	className?: string;
}) {
	const fill = color === "default" ? "#0A66C2" : color || "currentColor";
	return (
		<svg
			viewBox="0 0 24 24"
			width={size}
			height={size}
			fill={fill}
			className={className}
			xmlns="http://www.w3.org/2000/svg"
			role="img"
			aria-label="LinkedIn"
		>
			<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.852 3.37-1.852 3.601 0 4.267 2.37 4.267 5.455v6.288zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.063 2.063 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
		</svg>
	);
}

type SocialLinkData = {
	label: string;
	href?: string;
	Icon: BrandIcon;
	tint: string;
	brand: string;
};

type SocialGroup = {
	title: string;
	Icon: React.ComponentType<{ size: number }>;
	links: SocialLinkData[];
};

const SOCIAL_GROUPS: SocialGroup[] = [
	{
		title: "Video",
		Icon: Video,
		links: [
			{
				label: "YouTube",
				href: "https://www.youtube.com/@AlperTheOrtac",
				Icon: SiYoutube,
				tint: "color-mix(in srgb, #FF0000 30%, white)",
				brand: "#FF0000",
			},
			{
				label: "TikTok",
				href: "https://www.tiktok.com/@alperortac",
				Icon: SiTiktok,
				tint: "#e6e7ec",
				brand: "#000000",
			},
			{
				label: "Instagram",
				href: "https://www.instagram.com/alper.the.ortac/",
				Icon: SiInstagram,
				tint: "color-mix(in srgb, #E4405F 30%, white)",
				brand: "#E4405F",
			},
		],
	},
	{
		title: "Posts",
		Icon: MessageCircle,
		links: [
			{
				label: "X (Twitter)",
				href: "https://x.com/alperortac",
				Icon: SiX,
				tint: "#dde0e6",
				brand: "#000000",
			},
			{
				label: "Threads",
				href: "https://www.threads.com/@alper.the.ortac",
				Icon: SiThreads,
				tint: "#e8e9ee",
				brand: "#000000",
			},
			{
				label: "Bluesky",
				href: "https://bsky.app/profile/alperortac.bsky.social",
				Icon: SiBluesky,
				tint: "color-mix(in srgb, #0285FF 30%, white)",
				brand: "#0285FF",
			},
		],
	},
	{
		title: "Pro",
		Icon: Briefcase,
		links: [
			{
				label: "GitHub",
				href: "https://github.com/alp82",
				Icon: SiGithub,
				tint: "#dee1e6",
				brand: "#181717",
			},
			{
				label: "LinkedIn",
				href: "https://www.linkedin.com/in/alper-ortac-b8319549/",
				Icon: SiLinkedin,
				tint: "color-mix(in srgb, #0A66C2 30%, white)",
				brand: "#0A66C2",
			},
		],
	},
];

const SOCIAL_LINK_CLASS =
	"btn-brutalist flex items-center justify-between w-full text-left group font-black uppercase tracking-wider";

function SocialLink({ label, href, Icon, tint, brand }: SocialLinkData) {
	const body = (
		<>
			<span className="flex items-center gap-3 min-w-0">
				<span
					style={{ "--icon-c": brand } as React.CSSProperties}
					className="flex items-center justify-center shrink-0 transition-colors duration-200 text-[var(--icon-c)] group-hover:text-white"
				>
					<Icon size={28} color="currentColor" />
				</span>
				<span className="truncate">{label}</span>
			</span>
			<ArrowRight
				size={22}
				strokeWidth={3}
				className="opacity-0 translate-x-3 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 ease-out shrink-0"
			/>
		</>
	);

	const style = {
		"--btn-tint": tint,
		"--btn-tint-hover": brand,
		"--btn-text-hover": "#ffffff",
	} as React.CSSProperties;

	if (href) {
		return (
			<a
				href={href}
				target="_blank"
				rel="noopener noreferrer"
				style={style}
				className={SOCIAL_LINK_CLASS}
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
			className={SOCIAL_LINK_CLASS}
		>
			{body}
		</button>
	);
}

export function LinktreeSection() {
	return (
		<section
			id={SECTION_IDS.linktree}
			className="py-24 px-6 relative overflow-hidden text-slate-900"
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
							<div className="space-y-3">
								{group.links.map((link) => (
									<SocialLink key={link.label} {...link} />
								))}
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
