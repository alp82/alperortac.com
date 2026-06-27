/*
 * Thin shared shell for Layer-2 inner frames.
 *
 * A frame is a CONTAINER: it renders its themed heading + decoration, then the
 * topic's REAL body (the shared `TopicBody`, passed as `children`) inside a
 * content region. This shell composes that heading+content pattern for frames
 * where the heading sits cleanly above the body; frames whose heading is
 * interleaved with chrome inline the same structure instead.
 *
 * ANCHOR-LESS by design — the Layer-1 Stage owns the `<article id>`. No `py-24`
 * and no accent layout: those belong to production's `SectionBody`, not here.
 *
 * Ships as part of the composer subsystem (see types.ts).
 */

export function FrameShell({
	heading,
	children,
	className,
	contentClassName,
}: {
	heading?: React.ReactNode;
	children: React.ReactNode;
	className?: string;
	contentClassName?: string;
}) {
	return (
		<div className={className}>
			{heading}
			<div className={contentClassName}>{children}</div>
		</div>
	);
}
