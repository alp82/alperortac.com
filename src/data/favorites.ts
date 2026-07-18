// The 24 all-time favorite titles (12 films, 12 series) - hand-editable, the
// Movies & TV analogue of ALBUMS in personal.ts. Rendered by the movies-tv
// band's PosterGrid (rotating 3x2 wall) and the /movies subpage FavoritesWall.
// Posters are static jpgs committed under public/posters/ (IMDb suggestion
// API one-time fetch); slugs are the kebab-case of the titles.
export type Favorite = {
	slug: string;
	title: string;
	year: string;
	kind: "film" | "series";
	poster: string;
	/** Per-title blurb - landing slot for ticket #33, unset until then. */
	blurb?: string;
};

export const FAVORITES: Favorite[] = [
	// Films
	{
		slug: "the-matrix",
		title: "The Matrix",
		year: "1999",
		kind: "film",
		poster: "/posters/the-matrix.jpg",
	},
	{
		slug: "fight-club",
		title: "Fight Club",
		year: "1999",
		kind: "film",
		poster: "/posters/fight-club.jpg",
	},
	{
		slug: "inception",
		title: "Inception",
		year: "2010",
		kind: "film",
		poster: "/posters/inception.jpg",
	},
	{
		slug: "memento",
		title: "Memento",
		year: "2000",
		kind: "film",
		poster: "/posters/memento.jpg",
	},
	{
		slug: "the-prestige",
		title: "The Prestige",
		year: "2006",
		kind: "film",
		poster: "/posters/the-prestige.jpg",
	},
	{
		slug: "pulp-fiction",
		title: "Pulp Fiction",
		year: "1994",
		kind: "film",
		poster: "/posters/pulp-fiction.jpg",
	},
	{
		slug: "snatch",
		title: "Snatch",
		year: "2000",
		kind: "film",
		poster: "/posters/snatch.jpg",
	},
	{
		slug: "interstellar",
		title: "Interstellar",
		year: "2014",
		kind: "film",
		poster: "/posters/interstellar.jpg",
	},
	{
		slug: "blade-runner-2049",
		title: "Blade Runner 2049",
		year: "2017",
		kind: "film",
		poster: "/posters/blade-runner-2049.jpg",
	},
	{
		slug: "oldboy",
		title: "Oldboy",
		year: "2003",
		kind: "film",
		poster: "/posters/oldboy.jpg",
	},
	{
		slug: "the-truman-show",
		title: "The Truman Show",
		year: "1998",
		kind: "film",
		poster: "/posters/the-truman-show.jpg",
	},
	{
		slug: "everything-everywhere-all-at-once",
		title: "Everything Everywhere All at Once",
		year: "2022",
		kind: "film",
		poster: "/posters/everything-everywhere-all-at-once.jpg",
	},
	// Series
	{
		slug: "breaking-bad",
		title: "Breaking Bad",
		year: "2008",
		kind: "series",
		poster: "/posters/breaking-bad.jpg",
	},
	{
		slug: "dark",
		title: "Dark",
		year: "2017",
		kind: "series",
		poster: "/posters/dark.jpg",
	},
	{
		slug: "mr-robot",
		title: "Mr. Robot",
		year: "2015",
		kind: "series",
		poster: "/posters/mr-robot.jpg",
	},
	{
		slug: "severance",
		title: "Severance",
		year: "2022",
		kind: "series",
		poster: "/posters/severance.jpg",
	},
	{
		slug: "true-detective",
		title: "True Detective",
		year: "2014",
		kind: "series",
		poster: "/posters/true-detective.jpg",
	},
	{
		slug: "arcane",
		title: "Arcane",
		year: "2021",
		kind: "series",
		poster: "/posters/arcane.jpg",
	},
	{
		slug: "better-call-saul",
		title: "Better Call Saul",
		year: "2015",
		kind: "series",
		poster: "/posters/better-call-saul.jpg",
	},
	{
		slug: "black-mirror",
		title: "Black Mirror",
		year: "2011",
		kind: "series",
		poster: "/posters/black-mirror.jpg",
	},
	{
		slug: "game-of-thrones",
		title: "Game of Thrones",
		year: "2011",
		kind: "series",
		poster: "/posters/game-of-thrones.jpg",
	},
	{
		slug: "rick-and-morty",
		title: "Rick and Morty",
		year: "2013",
		kind: "series",
		poster: "/posters/rick-and-morty.jpg",
	},
	{
		slug: "the-expanse",
		title: "The Expanse",
		year: "2015",
		kind: "series",
		poster: "/posters/the-expanse.jpg",
	},
	{
		slug: "westworld",
		title: "Westworld",
		year: "2016",
		kind: "series",
		poster: "/posters/westworld.jpg",
	},
];
