import { ExternalLink, Sun } from "lucide-react";
import { Fragment } from "react";
import { FOOTER_PROJECTS_INTRO } from "../../../data/footer";
import { PROJECTS } from "../../../data/projects";
import { SECTION_IDS } from "../../../data/sections";
import { FollowMeRow } from "./FollowMeRow";
import { FooterHeadline } from "./FooterHeadline";

export function FooterSection() {
	const currentYear = new Date().getFullYear();

	return (
		<footer
			id={SECTION_IDS.footer}
			className="py-16 px-6 border-t border-current/20 bg-slate-900/40 backdrop-blur-md transition-colors duration-100"
			style={{ color: "#f8fafc" }}
		>
			<div className="max-w-6xl mx-auto flex flex-col gap-12">
				<FooterHeadline />

				<div className="text-sm font-bold drop-shadow-sm">
					<span className="uppercase tracking-widest opacity-70 mr-2">
						{FOOTER_PROJECTS_INTRO}:
					</span>
					{PROJECTS.map((project, i) => (
						<Fragment key={project.slug}>
							{i > 0 && <span className="opacity-40 mx-2">·</span>}
							<a
								href={project.link}
								target="_blank"
								rel="noopener noreferrer"
								className="underline decoration-current/40 underline-offset-4 hover:decoration-current transition-colors inline-flex items-center gap-1"
							>
								{project.title}
								<ExternalLink size={12} aria-hidden="true" />
							</a>
						</Fragment>
					))}
				</div>

				<FollowMeRow />

				<div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8 border-t border-current/15">
					<div className="font-black uppercase tracking-tighter drop-shadow-sm">
						© {currentYear} ALPER ORTAC
					</div>
					<a
						href={`#${SECTION_IDS.start}`}
						className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest drop-shadow-sm rounded-sm hover:opacity-70 transition-opacity focus-visible:ring-2 focus-visible:ring-current"
					>
						<Sun size={16} aria-hidden="true" />
						To the top
					</a>
				</div>
			</div>
		</footer>
	);
}
