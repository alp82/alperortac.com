export type CareerEntry = {
	year: string;
	role: string;
	company: string;
	desc: string;
	stack: string[];
};

export const CAREER_TIMELINE: CareerEntry[] = [
	{
		year: "Since 2021",
		role: "Lead Engineer",
		company: "Genius Sports — London, UK (Remote from DE)",
		desc: "Dynamic Sports Videos for Programmatic & Social.",
		stack: ["Python", "TypeScript", "AWS", "Kubernetes"],
	},
	{
		year: "2021",
		role: "Lead Frontend Engineer",
		company: "Spirable — London, UK (Remote from DE)",
		desc: "Dynamic Ads for Social Media.",
		stack: ["TypeScript", "React", "Vue.JS", "Material UI"],
	},
	{
		year: "2019 — 2021",
		role: "Lead Frontend Engineer",
		company: "enercast — Kassel, Germany",
		desc: "Wind/Solar Energy Forecasts.",
		stack: ["TypeScript", "React", "Redux", "Highcharts"],
	},
	{
		year: "2013 — 2019",
		role: "Frontend Engineer",
		company: "Cisco Systems — Kassel, Germany",
		desc: "Business SPA for Asset Management.",
		stack: ["Angular", "Vue.js", "GraphQL", "Highcharts", "D3"],
	},
	{
		year: "2012 — 2013",
		role: "Frontend Engineer",
		company: "Joulex — Kassel, Germany",
		desc: "Energy Management Web Application.",
		stack: ["Qooxdoo", "Play", "PostgreSQL"],
	},
	{
		year: "2007 — 2012",
		role: "Founder",
		company: "Acama Systems",
		desc: "Web agency building custom solutions.",
		stack: ["JavaScript", "Java", "PHP", "MySQL"],
	},
	{
		year: "2005 — 2009",
		role: "Web Engineer",
		company: "miobambino",
		desc: "E-commerce for children clothes with individual prints.",
		stack: ["PHP", "MySQL", "JavaScript", "HTML", "CSS"],
	},
];
