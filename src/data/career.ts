export type CareerEntry = {
	year: string;
	/** Numeric span for the proportional timeline axis (fractions = mid-year). */
	start: number;
	end: number;
	role: string;
	company: string;
	desc: string;
	stack: string[];
	highlight?: { story: string };
};

export const CAREER_TIMELINE: CareerEntry[] = [
	{
		year: "Since 2021",
		start: 2021,
		end: 2026,
		role: "Lead Engineer",
		company: "Genius Sports - London, UK (Remote from DE)",
		desc: "Dynamic Sports Videos for Programmatic & Social.",
		stack: ["Python", "TypeScript", "AWS", "Kubernetes"],
		highlight: {
			story:
				"Technical leadership across data orchestration, live video rendering and internal tooling. People management focused on personal growth and more satisfaction at work.",
		},
	},
	{
		year: "2021",
		start: 2021,
		end: 2021.8,
		role: "Lead Frontend Engineer",
		company: "Spirable - London, UK (Remote from DE)",
		desc: "Dynamic Ads for Social Media.",
		stack: ["Python", "TypeScript", "React", "Material UI"],
	},
	{
		year: "2019 - 2021",
		start: 2019,
		end: 2021,
		role: "Lead Frontend Engineer",
		company: "enercast - Kassel, Germany",
		desc: "Wind/Solar Energy Forecasts.",
		stack: ["TypeScript", "React", "Redux", "Highcharts"],
		highlight: {
			story:
				"Performance optimization for charts with 1M data points at 60fps.",
		},
	},
	{
		year: "2013 - 2019",
		start: 2013,
		end: 2019,
		role: "Frontend Engineer",
		company: "Cisco Systems - Kassel, Germany",
		desc: "Business SPA for Asset Management.",
		stack: ["Angular", "Vue.js", "GraphQL", "Highcharts", "D3"],
		highlight: {
			story:
				"Owning a complex frontend app that manages an arbitrary number of business assets.",
		},
	},
	{
		year: "2012 - 2013",
		start: 2012,
		end: 2013,
		role: "Frontend Engineer",
		company: "Joulex - Kassel, Germany",
		desc: "Energy Management Web Application.",
		stack: ["Qooxdoo", "Play", "PostgreSQL"],
	},
	{
		year: "2007 - 2012",
		start: 2007,
		end: 2012,
		role: "Founder",
		company: "Acama Systems",
		desc: "Web agency building custom solutions.",
		stack: ["JavaScript", "Java", "PHP", "MySQL"],
		highlight: {
			story:
				"Building individual web solutions for customers across the automotive, finance and health sectors.",
		},
	},
	{
		year: "2005 - 2009",
		start: 2005,
		end: 2009,
		role: "Web Engineer",
		company: "miobambino",
		desc: "E-commerce for children clothes with individual prints.",
		stack: ["PHP", "MySQL", "JavaScript", "HTML", "CSS"],
	},
];
