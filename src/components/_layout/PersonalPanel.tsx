import { FAVORITES } from "../../data/favorites";
import { ALBUMS, type Personal } from "../../data/personal";
import { FavoritesWall } from "./movies/FavoritesWall";
import { SnippetPlayersPrototype } from "./music/prototype/SnippetPlayersPrototype";
import { SubpageClose } from "./SubpageClose";
import { EarthGlobe } from "./travel/EarthGlobe";

export const getPersonalPanelTitleId = (slug: string) =>
	`personal-${slug}-title`;

type PersonalPanelProps = {
	item: Personal;
	open: boolean;
	onClose: () => void;
};

export function PersonalPanel({ item, open, onClose }: PersonalPanelProps) {
	const Icon = item.Icon;
	const titleId = getPersonalPanelTitleId(item.slug);

	return (
		<>
			<SubpageClose onClose={onClose} />
			<div
				className="subpage-column relative w-full max-w-3xl mx-auto my-[10vh]"
				style={{ color: item.panelFg }}
			>
				<div className="px-6 md:px-10 py-12">
					<div
						className={`w-24 h-24 mb-6 flex items-center justify-center border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(255,255,255,0.25)] ${item.tileBg} ${item.tileFg}`}
					>
						<Icon size={48} />
					</div>

					<h2
						id={titleId}
						className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-2"
					>
						{item.title}
					</h2>

					{item.slug === "music" && (
						<>
							<p className="mt-6 text-lg leading-relaxed">
								Some of my all-time and current favorites include:
							</p>
							{/* PROTOTYPE (#27) — renders the plain AlbumShelf unless ?variant= is present */}
							<SnippetPlayersPrototype albums={ALBUMS} active={open} />
						</>
					)}

					{item.slug === "movies" && (
						<>
							<p className="mt-6 text-lg leading-relaxed">
								Twelve films and twelve series I could rewatch anytime:
							</p>
							<FavoritesWall favorites={FAVORITES} />
						</>
					)}

					{/* Stub destination for the EarthTrigger - the INTERACTIVE 3D globe
					    of travelled locations replaces the big rotating earth (#21). */}
					{item.slug === "travel" && (
						<>
							<p className="mt-6 text-lg leading-relaxed">
								Thailand, Israel, Mexico, Grenada and all over Europe — next
								stamp: Japan 2027.
							</p>
							<div className="mt-10 flex justify-center">
								<EarthGlobe size="min(18rem, 70vw)" />
							</div>
						</>
					)}
				</div>
			</div>
		</>
	);
}
