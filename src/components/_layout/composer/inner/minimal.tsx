import type { InnerRenderProps } from "../types";
import { FrameShell } from "./FrameShell";
import { DENSITY_GAP, DENSITY_HEADING, DENSITY_MAXW } from "./shared";

/*
 * Inner: minimal — "clean cluster."
 *
 * The clean frame: a styled heading + a thin accent underline form the chrome,
 * then the topic's REAL body (the shared light plate) sits below. No heavy
 * chrome — lets the landscape do the talking. Signature toggle
 * (params.underline) = the accent underline beneath the heading; the `align`
 * knob swings the whole cluster between centered and left.
 */

export function MinimalCluster({
	topic,
	params,
	accent,
	children,
}: InnerRenderProps<"minimal">) {
	const centered = params.align === "center";

	const heading = (
		<div>
			<h2
				className={`${DENSITY_HEADING[params.density]} font-black uppercase tracking-tighter leading-[0.9] drop-shadow-[0_2px_16px_rgba(0,0,0,0.45)]`}
			>
				{topic.heading}
			</h2>
			{params.underline && (
				<span
					className={`${centered ? "mx-auto" : "ml-0"} mt-4 block h-1.5 w-20 rounded-full`}
					style={{ background: accent }}
					aria-hidden="true"
				/>
			)}
		</div>
	);

	return (
		<FrameShell
			className={`flex flex-col ${centered ? "items-center text-center" : "items-start text-left"} ${DENSITY_GAP[params.density]}`}
			heading={heading}
			contentClassName={`w-full ${DENSITY_MAXW[params.density]}`}
		>
			{children}
		</FrameShell>
	);
}
