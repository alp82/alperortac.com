/*
 * claude-statusline subpage artwork (wayfinder #49).
 * The statusline IS the identity: a static, faithful HTML rendering of the
 * script's one-line terminal output - dir + branch, active model, context
 * meter, and the 5h / 7d / Fable windows as usage-over-elapsed stacked bars
 * under a resting prompt. Every colour is the exact truecolor value from
 * statusline.sh, and the sample numbers are picked so the 5h cell shows the
 * "using it faster than the clock" overshoot the section body explains, while
 * 7d sits safely under the clock. Static by design: nothing animates, so
 * reduced-motion needs no special casing.
 */

// Truecolor values lifted verbatim from statusline.sh.
const GREEN = "rgb(140, 194, 74)";
const YELLOW = "rgb(220, 200, 60)";
const RED = "rgb(220, 60, 60)";
const ELAPSED_BLUE = "rgb(40, 80, 130)";
const TRACK = "rgb(55, 55, 55)";
const DIM = "rgb(138, 138, 138)";
// xterm-256 colour 74, the script's dir segment.
const DIR_BLUE = "#5fafd7";

// Limit colour (5h/7d/Fable): green < 50, yellow 50-80, red > 80.
export function limitColor(pct: number): string {
	if (pct > 80) return RED;
	if (pct >= 50) return YELLOW;
	return GREEN;
}

// Context colour: green < 25, yellow 25-49, red >= 50 - tighter than the
// limit bars because a full context window stops you working right away.
export function ctxColor(pct: number): string {
	if (pct >= 50) return RED;
	if (pct >= 25) return YELLOW;
	return GREEN;
}

export const STRIP_CTX_PCT = 42;

// usage = top half (colour-coded), elapsed = bottom half (blue window time).
export const STRIP_WINDOWS = [
	{ label: "5h", usage: 62, elapsed: 38, reset: "1h54m" },
	{ label: "7d", usage: 41, elapsed: 55, reset: "3d10h" },
	{ label: "Fable", usage: 18, elapsed: 30, reset: "5d2h" },
] as const;

function Sep() {
	return <span style={{ color: TRACK }}>│</span>;
}

function StackedBar({ usage, elapsed }: { usage: number; elapsed: number }) {
	return (
		<span
			className="inline-flex w-20 shrink-0 flex-col"
			style={{ backgroundColor: TRACK }}
		>
			<span
				className="h-1.5"
				style={{ width: `${usage}%`, backgroundColor: limitColor(usage) }}
			/>
			<span
				className="h-1.5"
				style={{ width: `${elapsed}%`, backgroundColor: ELAPSED_BLUE }}
			/>
		</span>
	);
}

export function StatuslineStrip() {
	return (
		<div
			role="img"
			aria-label={`The statusline under a resting terminal prompt: directory and branch, the active model, a context meter at ${STRIP_CTX_PCT}%, and the 5-hour, 7-day and Fable windows as colour-coded usage bars stacked over blue elapsed-time bars, each with its reset countdown.`}
			className="mb-4 rounded-md border border-white/15 bg-[#101010] px-4 py-3 font-mono text-[13px] leading-relaxed"
		>
			<div aria-hidden="true">
				<div className="mb-2.5" style={{ color: DIM }}>
					❯{" "}
					<span
						className="inline-block h-[15px] w-[7px] translate-y-[3px]"
						style={{ backgroundColor: TRACK }}
					/>
				</div>
				<div className="flex flex-wrap items-center gap-x-2 gap-y-2">
					<span className="whitespace-nowrap" style={{ color: DIR_BLUE }}>
						alperortac.com <span style={{ color: DIM }}>⎇ main</span>
					</span>
					<Sep />
					<span className="whitespace-nowrap" style={{ color: GREEN }}>
						★ Fable
					</span>
					<Sep />
					<span className="inline-flex items-center gap-1.5 whitespace-nowrap">
						<span style={{ color: DIM }}>Ctx</span>
						<span
							className="inline-flex h-3 w-20 shrink-0"
							style={{ backgroundColor: TRACK }}
						>
							<span
								className="h-full"
								style={{
									width: `${STRIP_CTX_PCT}%`,
									backgroundColor: ctxColor(STRIP_CTX_PCT),
								}}
							/>
						</span>
						<span style={{ color: ctxColor(STRIP_CTX_PCT) }}>
							{STRIP_CTX_PCT}%
						</span>
					</span>
					{STRIP_WINDOWS.map((w) => (
						<span
							key={w.label}
							className="inline-flex items-center gap-x-2 whitespace-nowrap"
						>
							<Sep />
							<span className="inline-flex items-center gap-1.5">
								<span style={{ color: DIM }}>{w.label}</span>
								<StackedBar usage={w.usage} elapsed={w.elapsed} />
								<span style={{ color: limitColor(w.usage) }}>{w.usage}%</span>
								<span style={{ color: DIM }}>↻{w.reset}</span>
							</span>
						</span>
					))}
				</div>
			</div>
		</div>
	);
}
