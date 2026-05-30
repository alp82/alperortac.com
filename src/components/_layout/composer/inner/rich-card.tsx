import { SectionBody } from "../SectionBody";
import type { InnerRenderProps } from "../types";

/*
 * Inner: rich-card (DEFAULT)
 *
 * Renders the live shipped section card via the shared SectionBody; ignores the
 * inner-style params (its chrome is fixed). Reads only topic / isNight /
 * lastTriggerRef; the params/index/accent the contract passes are inert here.
 */

export function RichCardCluster({
	topic,
	isNight,
	lastTriggerRef,
}: InnerRenderProps) {
	// Intentionally ignores `children`: unlike the other 26 frames (which wrap
	// the shared TopicBody passed as children), rich-card renders the FULL
	// shipped card itself via SectionBody.
	return (
		<SectionBody
			topic={topic}
			isNight={isNight}
			lastTriggerRef={lastTriggerRef}
		/>
	);
}
