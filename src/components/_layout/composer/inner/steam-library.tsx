import type { InnerRenderProps } from "../types";
import { DENSITY_MAXW } from "./shared";

/*
 * Inner: steam-library - "on your shelf."
 *
 * A PC game-client library page is the frame: a capsule art strip up top (a
 * themed gradient, no real art), the heading as the game title, a green
 * install/PLAY button beside "hrs on record" + an achievement completion bar,
 * the topic's REAL body seated bare as the store description, and an optional
 * "friends playing" footer row. All chrome text is deterministic theater -
 * fixed strings ("247 hrs on record", "92%"), never computed, all
 * aria-hidden. No real-brand marks - generic client chrome only.
 * Signature toggle (params.friends) = the friends-playing footer; theming knob
 * (shelf) recolors the client surface via the `.stl-*` inline vars
 * (--stl-shell / --stl-soft / --stl-play - the sbb --sbb-* convention).
 */

/** shelf → { shell, soft, play } - client surface core, faded wash, play-button ink. */
const SHELVES: Record<
	InnerRenderProps<"steam-library">["params"]["shelf"],
	{ shell: string; soft: string; play: string }
> = {
	steam: { shell: "#1b2838", soft: "#16202d", play: "#5ba32b" },
	midnight: { shell: "#171b2e", soft: "#10131f", play: "#7c5cff" },
	slate: { shell: "#1e232b", soft: "#14181e", play: "#38bdf8" },
};

/** Fixed friend avatars - initials only, generic. */
const FRIENDS = ["JD", "MK", "AV"];

export function SteamLibraryCluster({
	topic,
	params,
	children,
}: InnerRenderProps<"steam-library">) {
	const s = SHELVES[params.shelf];

	return (
		<div className={`w-full ${DENSITY_MAXW[params.density]}`}>
			<div
				className="stl relative text-left"
				style={
					{
						"--stl-shell": s.shell,
						"--stl-soft": s.soft,
						"--stl-play": s.play,
					} as React.CSSProperties
				}
			>
				{/* capsule art strip - themed gradient, no real art */}
				<div className="stl-capsule relative" aria-hidden="true">
					<span className="stl-capsule-tag">LIBRARY</span>
				</div>

				<div className="relative px-6 md:px-9 pt-5">
					{/* title + play row */}
					<div className="flex items-center justify-between gap-4 flex-wrap">
						<h2 className="stl-title font-bold text-3xl md:text-5xl leading-none tracking-tight">
							{topic.heading}
						</h2>
						<span
							className="stl-play inline-flex items-center gap-2 text-sm font-bold"
							aria-hidden="true"
						>
							▶ Play
						</span>
					</div>

					{/* meta row - playtime + achievement bar */}
					<div
						className="stl-meta relative mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] font-semibold"
						aria-hidden="true"
					>
						<span className="stl-hours">⏱ 247 hrs on record</span>
						<span className="stl-ach">
							<span className="stl-ach-label">Achievements 92%</span>
							<span className="stl-ach-bar">
								<span className="stl-ach-fill" />
							</span>
						</span>
					</div>
				</div>

				{/* the topic's REAL body - seated bare as the store description */}
				<div className="relative px-6 md:px-9 py-6">{children}</div>

				{/* friends-playing footer */}
				{params.friends && (
					<div
						className="stl-friends relative mx-6 md:mx-9 mb-5 flex items-center gap-3 text-[12px] font-semibold"
						aria-hidden="true"
					>
						<span className="stl-friends-dot" />
						<span className="stl-friends-avatars">
							{FRIENDS.map((f) => (
								<span key={f} className="stl-friends-avatar">
									{f}
								</span>
							))}
						</span>
						<span className="stl-friends-label">3 friends playing</span>
					</div>
				)}
			</div>
		</div>
	);
}
