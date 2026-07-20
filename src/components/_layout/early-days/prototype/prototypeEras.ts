/*
 * PROTOTYPE seed data (wayfinder #28) - the approved five-era prose in Alper's
 * words, split 16 -> 16 + 18. Throwaway: lives only inside the era-media
 * prototype so the real `stories.ts` + its 4-era test suite stay untouched
 * until /forge:go folds the winning treatment (and this prose) into main.
 *
 * No em/en dashes (repo rule TC-SD-07) - hyphen-minus only.
 */
export type ProtoEra = {
	age: string;
	ageSuffix: string;
	caption: string;
	beats: string[];
};

export const PROTOTYPE_ERAS: ProtoEra[] = [
	{
		age: "12",
		ageSuffix: "",
		caption: "QBasic · Turbo Pascal · Delphi",
		beats: [
			"I started coding with QBasic when I was 12 - text adventures and sounds squeezed out of the PC speaker. Then a bit of graphics in Turbo Pascal, and a look at Delphi.",
		],
	},
	{
		age: "16",
		ageSuffix: "",
		caption: "SELFHTML · floppies · CSS",
		beats: [
			"At 16 I found my love for web development: HTML and CSS. There was no internet at home - my parents knew it would pull me away from school, so I had to finish first.",
			"I learned from SELFHTML on the school PCs and copied the pages onto floppies to keep going at home. Later, JavaScript.",
		],
	},
	{
		age: "18",
		ageSuffix: "",
		caption: "PC-room keys · CS · StarCraft · FastTracker",
		beats: [
			"I got the keys to the PC room at school. I was responsible with them - and in the afternoons we played CS and StarCraft. My parents were proud I was staying late; they thought I was learning.",
			"I broke DOS and Windows constantly just to see what would happen, and made music in FastTracker - loved it.",
		],
	},
	{
		age: "19",
		ageSuffix: "",
		caption: "56k · the whole world",
		beats: ["Then, internet. Mind blown."],
	},
	{
		age: "20",
		ageSuffix: "s",
		caption: "IRC · ICQ · LAN parties",
		beats: [
			"I was admin in a forum for my friends. We talked on IRC, later ICQ. Gaming and LAN parties - lots of gaming. My digital life had begun.",
		],
	},
];
