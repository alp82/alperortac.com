/*
 * PROTOTYPE — throwaway data for the movies-tv poster grid prototype (#22).
 *
 * Plan: two variants of the poster treatment on the existing movies-tv band
 * section, switchable via `?variant=` (a | b | off) — see PrototypeSwitcher.
 *
 * The pool below is a DRAFT — Alper prunes/extends it before the real build.
 * Images live in public/prototype-posters/ (throwaway fetches, not the final
 * committed TMDB set).
 */

export type PrototypePoster = {
	slug: string;
	title: string;
	year: string;
	kind: "film" | "series";
	src: string;
};

export const PROTOTYPE_POSTERS: PrototypePoster[] = [
	{
		slug: "the-matrix",
		kind: "film",
		title: "The Matrix",
		year: "1999",
		src: "/prototype-posters/the-matrix.jpg",
	},
	{
		slug: "fight-club",
		kind: "film",
		title: "Fight Club",
		year: "1999",
		src: "/prototype-posters/fight-club.jpg",
	},
	{
		slug: "breaking-bad",
		kind: "series",
		title: "Breaking Bad",
		year: "2008",
		src: "/prototype-posters/breaking-bad.jpg",
	},
	{
		slug: "inception",
		kind: "film",
		title: "Inception",
		year: "2010",
		src: "/prototype-posters/inception.jpg",
	},
	{
		slug: "memento",
		kind: "film",
		title: "Memento",
		year: "2000",
		src: "/prototype-posters/memento.jpg",
	},
	{
		slug: "the-prestige",
		kind: "film",
		title: "The Prestige",
		year: "2006",
		src: "/prototype-posters/the-prestige.jpg",
	},
	{
		slug: "pulp-fiction",
		kind: "film",
		title: "Pulp Fiction",
		year: "1994",
		src: "/prototype-posters/pulp-fiction.jpg",
	},
	{
		slug: "dark",
		kind: "series",
		title: "Dark",
		year: "2017",
		src: "/prototype-posters/dark.jpg",
	},
	{
		slug: "mr-robot",
		kind: "series",
		title: "Mr. Robot",
		year: "2015",
		src: "/prototype-posters/mr-robot.jpg",
	},
	{
		slug: "severance",
		kind: "series",
		title: "Severance",
		year: "2022",
		src: "/prototype-posters/severance.jpg",
	},
	{
		slug: "arcane",
		kind: "series",
		title: "Arcane",
		year: "2021",
		src: "/prototype-posters/arcane.jpg",
	},
	{
		slug: "true-detective",
		kind: "series",
		title: "True Detective",
		year: "2014",
		src: "/prototype-posters/true-detective.jpg",
	},
];
