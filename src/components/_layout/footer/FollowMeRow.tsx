import { SiInstagram, SiTiktok } from "@icons-pack/react-simple-icons";
import {
	type BrandIcon,
	InstagramIcon,
	SOCIAL_LINKS,
	TiktokIcon,
} from "../social/socialLinks";

// The Find-Me block renders two bespoke glyphs in their native multi-color
// marks (Instagram's gradient, TikTok's cyan/red split). This monochrome row
// needs every icon in a single currentColor fill, so those two are swapped for
// the flat Simple Icons equivalents; all other glyphs already honor `color`.
function monoIcon(Icon: BrandIcon): BrandIcon {
	if (Icon === InstagramIcon) return SiInstagram;
	if (Icon === TiktokIcon) return SiTiktok;
	return Icon;
}

export function FollowMeRow() {
	return (
		<div className="flex items-center gap-6" style={{ color: "#f8fafc" }}>
			<div className="flex flex-col items-center gap-2 shrink-0">
				<span className="[writing-mode:vertical-rl] uppercase tracking-[0.3em] text-xs font-black opacity-70">
					Follow Me
				</span>
				<span className="w-px h-6 bg-current opacity-40" />
			</div>
			<div className="flex flex-wrap items-center gap-3">
				{SOCIAL_LINKS.map((link) => {
					const Icon = monoIcon(link.Icon);
					return (
						<a
							key={link.label}
							href={link.href}
							aria-label={link.label}
							target="_blank"
							rel="noopener noreferrer"
							className="opacity-70 hover:opacity-100 transition-opacity p-2 -m-2 rounded-sm focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-current"
						>
							<Icon size={20} color="currentColor" />
						</a>
					);
				})}
			</div>
		</div>
	);
}
