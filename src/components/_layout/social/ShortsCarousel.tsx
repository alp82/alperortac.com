import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { YOUTUBE_SHORTS, type YoutubeShort } from "../../../data/youtubeShorts";
import { useShortsRail } from "./useShortsRail";

const CHANNEL_NAME = "Alper Ortac";
const CHANNEL_AVATAR_SRC = "/youtube-avatar.jpg";

export function viewsLabel(n: number): string {
	return n >= 1000
		? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`
		: String(n);
}

// Shorts "S" mark split into a red S plus a solid white play notch, so the
// triangle reads solid when it sits directly over a photo thumbnail.
function ShortsSGlyph() {
	return (
		<svg
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true"
		>
			<path
				fill="#FF0000"
				d="m18.931 9.99-1.441-.601 1.717-.913a4.48 4.48 0 0 0 1.874-6.078 4.506 4.506 0 0 0-6.09-1.874L4.792 5.929a4.504 4.504 0 0 0-2.402 4.193 4.521 4.521 0 0 0 2.666 3.904c.036.012 1.442.6 1.442.6l-1.706.901a4.51 4.51 0 0 0-2.369 3.967A4.528 4.528 0 0 0 6.93 24c.725 0 1.437-.174 2.08-.508l10.21-5.406a4.494 4.494 0 0 0 2.39-4.192 4.525 4.525 0 0 0-2.678-3.904Z"
			/>
			<path fill="#FFFFFF" d="M9.597 15.19V8.824l6.007 3.184z" />
		</svg>
	);
}

// Eye icon labelling view counts as a metric, never another play affordance.
function EyeIcon() {
	return (
		<svg
			className="w-[clamp(8px,5.73cqw,11px)] h-[clamp(8px,5.73cqw,11px)] shrink-0"
			width="11"
			height="11"
			viewBox="0 0 24 24"
			fill="currentColor"
			aria-hidden="true"
		>
			<path d="M12 5C5.5 5 1.7 10.6 1 12c.7 1.4 4.5 7 11 7s10.3-5.6 11-7c-.7-1.4-4.5-7-11-7zm0 11.5A4.5 4.5 0 1 1 12 7.5a4.5 4.5 0 0 1 0 9zm0-7.2A2.7 2.7 0 1 0 12 14.7a2.7 2.7 0 0 0 0-5.4z" />
		</svg>
	);
}

function ShortCard({ short }: { short: YoutubeShort }) {
	const vertical = `https://i.ytimg.com/vi/${short.id}/oardefault.jpg`;
	const fallback = `https://i.ytimg.com/vi/${short.id}/hqdefault.jpg`;
	const [src, setSrc] = useState<string | null>(vertical);
	const [avatarFailed, setAvatarFailed] = useState(false);
	return (
		<a
			className="short-card group"
			href={`https://www.youtube.com/shorts/${short.id}`}
			target="_blank"
			rel="noopener noreferrer"
			aria-label={`${short.title} - watch on YouTube Shorts`}
			draggable={false}
		>
			<div className="short-card-inner relative aspect-[9/16] overflow-hidden bg-[#111111] shrink-0">
				{src && (
					<img
						className="block w-full h-full object-cover"
						src={src}
						alt=""
						loading="lazy"
						draggable={false}
						onError={() =>
							setSrc((current) => (current === vertical ? fallback : null))
						}
					/>
				)}
				<div className="absolute top-0 left-0 right-0 z-[2] flex items-start gap-[min(3.65cqw,7px)] pt-[min(4.17cqw,8px)] pb-[min(7.29cqw,14px)] px-[min(4.69cqw,9px)] bg-[linear-gradient(to_bottom,rgba(0,0,0,0.78)_0%,rgba(0,0,0,0.42)_65%,rgba(0,0,0,0)_100%)]">
					{!avatarFailed && (
						<img
							className="w-[min(12.5cqw,28px)] h-[min(12.5cqw,28px)] rounded-full border-[1.5px] border-white shrink-0 object-cover shadow-[0_1px_2px_rgba(0,0,0,0.5)] bg-[#666666]"
							src={CHANNEL_AVATAR_SRC}
							alt=""
							loading="lazy"
							draggable={false}
							onError={() => setAvatarFailed(true)}
						/>
					)}
					<div className="min-w-0">
						<p className="text-[clamp(8px,5.47cqw,10.5px)] font-extrabold leading-[1.24] text-white line-clamp-2 [text-shadow:0_1px_2px_rgba(0,0,0,0.7)]">
							{short.title}
						</p>
						<p className="mt-0.5 text-[clamp(7.5px,4.69cqw,9px)] font-semibold text-white whitespace-nowrap overflow-hidden text-ellipsis">
							{CHANNEL_NAME}
						</p>
					</div>
				</div>
				<span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[2] w-[min(28.125cqw,60px)] drop-shadow-[0_3px_8px_rgba(0,0,0,0.55)] transition-transform duration-[120ms] ease-out group-hover:scale-[1.06] motion-reduce:transform-none">
					<ShortsSGlyph />
				</span>
				<div className="absolute left-0 right-0 bottom-0 z-[2] flex items-center gap-[min(2.08cqw,4px)] bg-black/[.58] px-[min(4.69cqw,9px)] py-[min(3.125cqw,6px)] text-[clamp(7.5px,4.95cqw,9.5px)] font-extrabold text-white">
					<EyeIcon /> {viewsLabel(short.views)} views
				</div>
			</div>
		</a>
	);
}

export function ShortsCarousel({ isNight }: { isNight: boolean }) {
	const {
		railRef,
		trackRef,
		barRef,
		thumbRef,
		wrapProps,
		railProps,
		barProps,
		barGrabbing,
		prev,
		next,
		canScroll,
	} = useShortsRail();
	const arrowClass = `btn-brutalist btn-brutalist--chip inline-flex items-center justify-center${
		isNight ? " btn-brutalist--night" : ""
	}`;
	return (
		<div className="mb-12" {...wrapProps}>
			<div className="flex items-center gap-3 mb-4">
				<h3 className="text-xs font-black uppercase tracking-[0.3em] opacity-70">
					Latest Shorts
				</h3>
				<div className="flex-1 h-px bg-slate-900/20" />
			</div>
			<div className="flex gap-2 mb-3">
				<button
					type="button"
					aria-label="Scroll to previous Short"
					onClick={prev}
					disabled={!canScroll}
					className={arrowClass}
				>
					<ChevronLeft size={16} strokeWidth={3} />
				</button>
				<button
					type="button"
					aria-label="Scroll to next Short"
					onClick={next}
					disabled={!canScroll}
					className={arrowClass}
				>
					<ChevronRight size={16} strokeWidth={3} />
				</button>
			</div>
			<div className="shorts-rail" ref={railRef} {...railProps}>
				<div className="shorts-track" ref={trackRef}>
					{YOUTUBE_SHORTS.map((short) => (
						<ShortCard key={short.id} short={short} />
					))}
				</div>
			</div>
			<div
				ref={barRef}
				role="presentation"
				aria-hidden="true"
				hidden
				{...barProps}
				className={`shorts-scrollbar${isNight ? " shorts-scrollbar--night" : ""}${barGrabbing ? " shorts-scrollbar--grabbing" : ""}`}
			>
				<div ref={thumbRef} className="shorts-scrollbar__thumb" />
			</div>
		</div>
	);
}
