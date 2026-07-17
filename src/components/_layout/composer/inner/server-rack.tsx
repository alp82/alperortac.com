import type { InnerRenderProps } from "../types";
import { DENSITY_MAXW } from "./shared";

/*
 * Inner: server-rack - "homelab rack unit."
 *
 * A 19-inch rack unit is the frame: slotted rack screws on both ears (not a
 * continuous hole strip - that read as a film strip on the walk), a
 * brushed-metal faceplate carrying the heading as the unit label, a
 * PWR/NET/DSK status strip plus an 8-lamp activity bank, a vent-slit block,
 * the topic's REAL body seated below as the mounted unit, and an ethernet
 * ports row along the bottom with two patched cables dropping out of frame.
 * Signature toggle (params.leds) = ALL lamp decoration (status strip,
 * activity bank, port link lights - blinks staggered in CSS, stilled under
 * reduced motion); theming knob (finish) = panel + rail metal (midnight /
 * graphite / steel), handed to the `.rack-*` classes as --rack-panel /
 * --rack-rail / --rack-ink inline vars (the timecard --tc-* convention).
 * The NET lamp, one activity lamp and one patch cable read the accent prop
 * only - never the finish.
 */

/** finish → { panel, rail, ink } - faceplate metal, rail metal, label ink. */
const FINISHES: Record<
	InnerRenderProps<"server-rack">["params"]["finish"],
	{ panel: string; rail: string; ink: string }
> = {
	graphite: { panel: "#23272e", rail: "#14171c", ink: "#e5e7eb" },
	steel: { panel: "#414a54", rail: "#272e36", ink: "#eef1f4" },
	midnight: { panel: "#111a2b", rail: "#0a101d", ink: "#dbe4f3" },
};

/** The status strip is fixed hardware chrome: PWR steady green, NET blinking
 * accent, DSK steady dim - labels and lamp order never vary by finish. */
const LEDS = [
	{ id: "pwr", label: "pwr" },
	{ id: "net", label: "net" },
	{ id: "dsk", label: "dsk" },
] as const;

/** The activity bank: 8 lamps, fixed tone + blink-phase pattern (SSR-stable,
 * no randomness) - green traffic, one accent lamp, two dark idles. */
const ACT_LAMPS = [
	{ id: "a1", tone: "green", phase: 1 },
	{ id: "a2", tone: "dim", phase: 0 },
	{ id: "a3", tone: "green", phase: 2 },
	{ id: "a4", tone: "net", phase: 3 },
	{ id: "a5", tone: "green", phase: 3 },
	{ id: "a6", tone: "dim", phase: 0 },
	{ id: "a7", tone: "green", phase: 1 },
	{ id: "a8", tone: "green", phase: 2 },
] as const;

/** The ports row: 6 RJ45 jacks, two patched (accent + green cables) - fixed
 * positions by design. */
const PORTS = [
	{ id: "p1", plug: null },
	{ id: "p2", plug: "net" },
	{ id: "p3", plug: null },
	{ id: "p4", plug: null },
	{ id: "p5", plug: "green" },
	{ id: "p6", plug: null },
] as const;

export function ServerRackCluster({
	topic,
	index,
	params,
	accent,
	children,
}: InnerRenderProps<"server-rack">) {
	const f = FINISHES[params.finish];

	return (
		<div className={`w-full ${DENSITY_MAXW[params.density]}`}>
			<div
				className="rack relative text-left"
				style={
					{
						"--rack-panel": f.panel,
						"--rack-rail": f.rail,
						"--rack-ink": f.ink,
						"--rack-net": accent,
					} as React.CSSProperties
				}
			>
				{/* rack ears - two slotted screws each, pure chrome */}
				<span className="rack-ear rack-ear--left" aria-hidden="true">
					<span className="rack-screw" />
					<span className="rack-screw" />
				</span>
				<span className="rack-ear rack-ear--right" aria-hidden="true">
					<span className="rack-screw" />
					<span className="rack-screw" />
				</span>

				{/* 1U faceplate: unit label + status strip + activity bank + vents */}
				<div className="rack-face relative px-5 md:px-7 py-4">
					<div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
						<div className="flex items-baseline gap-3 min-w-0">
							<h2 className="rack-label font-mono font-bold uppercase tracking-tight text-2xl md:text-4xl leading-none">
								{topic.heading}
							</h2>
							<span className="rack-unit-no font-mono text-[10px] uppercase tracking-[0.3em] whitespace-nowrap">
								u{String(index + 1).padStart(2, "0")}
							</span>
						</div>
						<div className="flex items-center gap-5">
							{params.leds && (
								<span
									className="rack-leds flex items-center gap-3"
									aria-hidden="true"
								>
									{LEDS.map((led) => (
										<span key={led.id} className="rack-led-group">
											<span className={`rack-led rack-led--${led.id}`} />
											<span className="rack-led-lbl font-mono">
												{led.label}
											</span>
										</span>
									))}
								</span>
							)}
							{params.leds && (
								<span className="rack-act" aria-hidden="true">
									{ACT_LAMPS.map((lamp) => (
										<span
											key={lamp.id}
											className={`rack-act-led rack-act-led--${lamp.tone} rack-act-led--ph${lamp.phase}`}
										/>
									))}
								</span>
							)}
							<span className="rack-vents" aria-hidden="true" />
						</div>
					</div>
				</div>

				{/* the mounted unit - the body sits clear on the dark panel */}
				<div className="rack-bay relative px-5 md:px-7 py-6">{children}</div>

				{/* ethernet ports row - two patched cables drop out of frame */}
				<div
					className="rack-ports relative flex items-center gap-2.5 px-5 md:px-7 py-3"
					aria-hidden="true"
				>
					<span className="rack-ports-lbl font-mono">eth</span>
					{PORTS.map((port) => (
						<span key={port.id} className="rack-jack">
							<span className="rack-jack-pins" />
							{port.plug && (
								<>
									<span className={`rack-plug rack-plug--${port.plug}`} />
									<span className={`rack-cable rack-cable--${port.plug}`} />
									{params.leds && (
										<span className={`rack-link rack-link--${port.plug}`} />
									)}
								</>
							)}
						</span>
					))}
				</div>
			</div>
		</div>
	);
}
