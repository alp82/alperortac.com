import { ExternalLink } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { PROJECT_ICONS, type Project } from "../data/projects";
import { useReducedMotion } from "./_layout/dive/useReducedMotion";
import { SubpageClose } from "./_layout/SubpageClose";

export const getProjectPanelTitleId = (slug: string) => `project-${slug}-title`;

type ProjectPanelProps = {
	project: Project;
	open: boolean;
	onClose: () => void;
};

export function ProjectPanel({ project, open, onClose }: ProjectPanelProps) {
	const Icon = PROJECT_ICONS[project.iconKey];
	const sentinelRef = useRef<HTMLDivElement>(null);
	const [stuck, setStuck] = useState(false);
	const reducedMotion = useReducedMotion();
	const titleId = getProjectPanelTitleId(project.slug);

	useEffect(() => {
		if (!open) return;
		const sentinel = sentinelRef.current;
		if (!sentinel) return;
		const scrollRoot = sentinel.closest(".panel-surface");
		const observer = new IntersectionObserver(
			(entries) => {
				const entry = entries[0];
				if (entry) setStuck(!entry.isIntersecting);
			},
			{ root: scrollRoot, rootMargin: "0px 0px 0px 0px", threshold: 0 },
		);
		observer.observe(sentinel);
		return () => observer.disconnect();
	}, [open]);

	return (
		<>
			<SubpageClose onClose={onClose} />
			<div className="subpage-column relative w-full max-w-3xl mx-auto my-[10vh] text-white">
				<div
					className={`panel-sticky-title ${stuck ? "is-stuck" : ""} bg-slate-900/90 backdrop-blur-md border-b border-white/20 pl-6 pr-16 py-3 flex items-center justify-between gap-4`}
				>
					<div className="flex items-center gap-3 min-w-0">
						<Icon size={20} />
						<span className="font-black uppercase tracking-tighter text-lg truncate">
							{project.title}
						</span>
						<div className="hidden md:flex gap-2">
							{project.tags.map((tag) => (
								<span
									key={tag}
									className="text-[10px] uppercase font-black tracking-widest opacity-70"
								>
									#{tag}
								</span>
							))}
						</div>
					</div>
					<a
						href={project.link}
						target="_blank"
						rel="noopener noreferrer"
						aria-label={`Visit ${project.title}`}
						className="shrink-0 inline-flex items-center gap-2 bg-white text-slate-900 px-3 py-1.5 font-black uppercase text-xs tracking-widest hover:-translate-y-0.5 transition-transform"
					>
						Visit <ExternalLink size={12} aria-hidden="true" />
					</a>
				</div>

				<div className="relative">
					{project.media.type === "video" ? (
						<div className="relative w-full h-[35vh] bg-black overflow-hidden">
							{open ? (
								reducedMotion ? (
									project.media.poster ? (
										<img
											src={project.media.poster}
											alt={`${project.title} demo poster`}
											className="w-full h-full object-cover"
										/>
									) : (
										// TODO(alp): generate proper poster frames
										<div
											role="img"
											aria-label={`${project.title} demo placeholder`}
											className="w-full h-full grid place-items-center"
											style={{
												backgroundColor: `color-mix(in srgb, ${project.panelColor} 20%, transparent)`,
											}}
										>
											<Icon size={120} className="opacity-80" />
										</div>
									)
								) : (
									<video
										key={project.slug}
										autoPlay
										muted
										loop
										playsInline
										preload="metadata"
										poster={project.media.poster}
										aria-label={`${project.title} demo video`}
										className="w-full h-full object-cover"
									>
										<source src={project.media.webm} type="video/webm" />
										<source src={project.media.mp4} type="video/mp4" />
									</video>
								)
							) : null}
						</div>
					) : (
						<div
							className="relative w-full h-[35vh] grid place-items-center"
							style={{
								backgroundColor: `color-mix(in srgb, ${project.panelColor} 20%, transparent)`,
							}}
						>
							{/* TODO(alp): swap for real Alp-River artwork */}
							<div className="flex flex-col items-center gap-4 text-center">
								<Icon size={120} />
								<div className="text-xs font-black uppercase tracking-widest opacity-80">
									Open source · TypeScript
								</div>
							</div>
						</div>
					)}
					<div ref={sentinelRef} className="h-px w-full" />

					<div className="max-w-3xl mx-auto px-6 py-12">
						<div className="flex items-center gap-3 mb-4">
							<Icon size={28} />
							<h2
								id={titleId}
								className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none"
							>
								{project.title}
							</h2>
						</div>
						<div className="flex flex-wrap gap-2 mb-10">
							{project.tags.map((tag) => (
								<span
									key={tag}
									className="text-[10px] uppercase font-black tracking-widest border-b-2 border-white/40"
								>
									#{tag}
								</span>
							))}
						</div>

						<a
							href={project.link}
							target="_blank"
							rel="noopener noreferrer"
							aria-label={`Visit ${project.title}`}
							className="inline-flex items-center gap-2 mb-12 bg-white text-slate-900 px-5 py-3 font-black uppercase text-sm tracking-widest hover:-translate-y-0.5 transition-transform shadow-[4px_4px_0px_0px_rgba(0,0,0,0.4)]"
						>
							Visit Project <ExternalLink size={14} aria-hidden="true" />
						</a>

						<section className="mb-10">
							<h3 className="text-xs font-black uppercase tracking-widest opacity-70 mb-2">
								Problem
							</h3>
							<p className="text-lg leading-relaxed">{project.problem}</p>
						</section>

						<section className="mb-10">
							<h3 className="text-xs font-black uppercase tracking-widest opacity-70 mb-2">
								Solution
							</h3>
							<p className="text-lg leading-relaxed">{project.solution}</p>
						</section>

						<section className="mb-10">
							<h3 className="text-xs font-black uppercase tracking-widest opacity-70 mb-2">
								Outcome
							</h3>
							<p className="text-lg leading-relaxed">{project.outcome}</p>
						</section>

						<section>
							<h3 className="text-xs font-black uppercase tracking-widest opacity-70 mb-3">
								Stack
							</h3>
							<ul className="flex flex-wrap gap-2">
								{project.stack.map((item) => (
									<li
										key={item}
										className="px-3 py-1 bg-white/10 border border-white/30 text-xs font-bold uppercase tracking-wider"
									>
										{item}
									</li>
								))}
							</ul>
						</section>
					</div>
				</div>
			</div>
		</>
	);
}
