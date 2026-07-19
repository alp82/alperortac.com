import { Clapperboard, Earth, type LucideIcon, Music } from "lucide-react";
import type { PersonalSlug } from "./topics";

export type Personal = {
	slug: PersonalSlug;
	title: string;
	Icon: LucideIcon;
	tileBg: string;
	tileFg: string;
	panelBg: string;
	panelFg: string;
};

export const PERSONAL: Personal[] = [
	{
		slug: "music",
		title: "Music",
		Icon: Music,
		tileBg: "bg-indigo-100",
		tileFg: "text-indigo-900",
		panelBg: "#312e81",
		panelFg: "#eef2ff",
	},
	{
		slug: "movies",
		title: "Movies & TV",
		Icon: Clapperboard,
		tileBg: "bg-rose-100",
		tileFg: "text-rose-900",
		// Palette echoes the streaming billboard's crimson --sbb-soft wash.
		panelBg: "#3b0a0a",
		panelFg: "#fff1f2",
	},
	{
		slug: "travel",
		title: "Travel",
		Icon: Earth,
		tileBg: "bg-sky-100",
		tileFg: "text-sky-900",
		// Deep ocean-night blue so the globe's landmasses pop against the panel.
		panelBg: "#082f49",
		panelFg: "#f0f9ff",
	},
];

export type Album = {
	artist: string;
	album: string;
	cover: string;
	blurb?: string;
};

export const ALBUMS: Album[] = [
	{
		artist: "Gojira",
		album: "The Way of All Flesh",
		cover: "/albums/gojira-the-way-of-all-flesh.jpg",
	},
	{
		artist: "Noisia",
		album: "Split The Atom",
		cover: "/albums/noisia-split-the-atom.jpg",
	},
	{
		artist: "Haken",
		album: "Virus",
		cover: "/albums/haken-virus.jpg",
	},
	{
		artist: "System of a Down",
		album: "Toxicity",
		cover: "/albums/system-of-a-down-toxicity.jpg",
	},
	{
		artist: "Rezz",
		album: "Certain Kind of Magic",
		cover: "/albums/rezz-certain-kind-of-magic.jpg",
	},
	{
		artist: "Farin Urlaub",
		album: "Am Ende der Sonne",
		cover: "/albums/farin-urlaub-am-ende-der-sonne.jpg",
	},
	{
		artist: "Periphery",
		album: "Periphery III: Select Difficulty",
		cover: "/albums/periphery-periphery-iii-select-difficulty.jpg",
	},
	{
		artist: "Misanthrop",
		album: "Analog",
		cover: "/albums/misanthrop-analog.jpg",
	},
	{
		artist: "Porcupine Tree",
		album: "The Incident",
		cover: "/albums/porcupine-tree-the-incident.jpg",
	},
	{
		artist: "Waltari",
		album: "Blood Sample",
		cover: "/albums/waltari-blood-sample.jpg",
	},
	{
		artist: "Savant",
		album: "VOID",
		cover: "/albums/savant-void.jpg",
	},
	{
		artist: "Muse",
		album: "Black Holes and Revelations",
		cover: "/albums/muse-black-holes-and-revelations.jpg",
	},
	{
		artist: "Nine Inch Nails",
		album: "Nine Inch Noize",
		cover: "/albums/nine-inch-nails-nine-inch-noize.jpg",
	},
	{
		artist: "Supergroove",
		album: "Traction",
		cover: "/albums/supergroove-traction.jpg",
	},
	{
		artist: "Unprocessed",
		album: "Angel",
		cover: "/albums/unprocessed-angel.jpg",
	},
	{
		artist: "Enter Shikari",
		album: "A Kiss for the Whole World",
		cover: "/albums/enter-shikari-a-kiss-for-the-whole-world.jpg",
	},
	{
		artist: "Soilwork",
		album: "Figure Number Five",
		cover: "/albums/soilwork-figure-number-five.jpg",
	},
];

export const PERSONAL_BY_SLUG: Record<PersonalSlug, Personal> =
	Object.fromEntries(PERSONAL.map((p) => [p.slug, p])) as Record<
		PersonalSlug,
		Personal
	>;
