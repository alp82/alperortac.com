import type { Favorite } from "../../../data/favorites";

/*
 * The /movies subpage poster wall - all 24 favorites under pill-styled
 * "Films" / "Series" section headers (the subpage's echo of the billboard's
 * category pills). Pure presentational: no rotation, no preload - lazy imgs
 * suffice on a scrolling panel. Each title is one <li> so a per-title blurb
 * paragraph (#33) drops in without restructuring.
 */

const SECTIONS = [
	{ kind: "film", label: "Films" },
	{ kind: "series", label: "Series" },
] as const;

export function FavoritesWall({ favorites }: { favorites: Favorite[] }) {
	return (
		<div className="mt-8 space-y-10">
			{SECTIONS.map((section) => (
				<section key={section.kind}>
					<h3 className="inline-block rounded-full ring-1 ring-white/20 bg-white/10 px-4 py-1 text-[11px] font-semibold tracking-[0.08em] uppercase">
						{section.label}
					</h3>
					<ul className="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-4">
						{favorites
							.filter((f) => f.kind === section.kind)
							.map((favorite) => (
								<li key={favorite.slug}>
									<div className="aspect-[2/3] rounded-md overflow-hidden ring-1 ring-white/10">
										<img
											src={favorite.poster}
											alt=""
											loading="lazy"
											className="object-cover w-full h-full"
										/>
									</div>
									<p className="mt-2 text-xs opacity-80 leading-snug">
										{favorite.title} ({favorite.year})
									</p>
								</li>
							))}
					</ul>
				</section>
			))}
		</div>
	);
}
