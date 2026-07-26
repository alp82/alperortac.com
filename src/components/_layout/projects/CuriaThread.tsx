/*
 * Curia subpage artwork (wayfinder #48).
 * The phone IS the identity: a static, faithful render of the #curia Discord
 * thread as it looks on a phone, walking the golden thread end to end -
 * frontier, dispatch, escalate, answer, preview, attach, resolve. Each leg is
 * announced by a Discord-style divider, so the artwork and the section body's
 * golden-thread line walk the same legs in the same order (pinned by test).
 *
 * The thread is self-referential on purpose: it dispatches ticket #48, the
 * ticket that authored this page.
 *
 * Hostnames are deliberately generic (`box.tailnet.ts.net`). The real box's
 * tailnet DNS name is not published here: attach sits behind tailnet
 * membership alone (curia's own hardening deferral), so a public page should
 * not hand out the exact target.
 *
 * Static by design: nothing animates, so reduced-motion needs no special
 * casing.
 */

// Discord dark-theme values, so the thread reads as the real surface.
const BG_CHAT = "#313338";
const BG_CHROME = "#2b2d31";
const BG_PHONE = "#1e1f22";
const TEXT = "#dbdee1";
const TEXT_MUTED = "#949ba4";
const TEXT_HEADER = "#f2f3f5";
const BLURPLE = "#5865f2";
const LINK = "#00a8fc";
const GREEN = "#23a55a";

export const PREVIEW_URL = "https://box.tailnet.ts.net:8517/";
export const ATTACH_URL = "https://box.tailnet.ts.net:8443/?arg=curia-48";

// The golden thread, in order. Each leg is one divider in the transcript, and
// the list is exported so a drift between the artwork and the ordered legs the
// section body names goes red in tests.
export const CURIA_LEGS = [
	"Frontier",
	"Dispatch",
	"Escalate",
	"Answer",
	"Preview",
	"Attach",
	"Resolve",
] as const;

function Divider({ leg }: { leg: string }) {
	return (
		<div className="my-3 flex items-center gap-2">
			<span className="h-px flex-1" style={{ backgroundColor: "#3f4147" }} />
			<span
				className="text-[9px] font-black uppercase tracking-[0.2em]"
				style={{ color: TEXT_MUTED }}
			>
				{leg}
			</span>
			<span className="h-px flex-1" style={{ backgroundColor: "#3f4147" }} />
		</div>
	);
}

function Message({
	author,
	bot,
	children,
}: {
	author: string;
	bot?: boolean;
	children: React.ReactNode;
}) {
	return (
		<div className="mb-2.5 flex gap-2">
			<span
				className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-black"
				style={{
					backgroundColor: bot ? BLURPLE : "#b4531f",
					color: "#ffffff",
				}}
			>
				{bot ? "C" : "A"}
			</span>
			<div className="min-w-0 flex-1">
				<div className="flex items-center gap-1.5">
					<span
						className="text-[12px] font-semibold"
						style={{ color: TEXT_HEADER }}
					>
						{author}
					</span>
					{bot ? (
						<span
							className="rounded px-1 text-[8px] font-bold uppercase tracking-wide"
							style={{ backgroundColor: BLURPLE, color: "#ffffff" }}
						>
							Bot
						</span>
					) : null}
				</div>
				<div className="text-[12px] leading-snug" style={{ color: TEXT }}>
					{children}
				</div>
			</div>
		</div>
	);
}

function Slash({ command, arg }: { command: string; arg?: string }) {
	return (
		<span className="font-mono">
			<span
				className="rounded px-1 py-0.5 font-semibold"
				style={{
					backgroundColor: "rgba(88, 101, 242, 0.22)",
					color: "#c9cdfb",
				}}
			>
				{command}
			</span>
			{arg ? <span style={{ color: TEXT_MUTED }}> {arg}</span> : null}
		</span>
	);
}

function Ticket({ id, title }: { id: string; title: string }) {
	return (
		<div className="flex gap-2">
			<span className="font-mono shrink-0" style={{ color: LINK }}>
				{id}
			</span>
			<span className="truncate">{title}</span>
		</div>
	);
}

function Url({ href }: { href: string }) {
	return (
		<span className="font-mono break-all" style={{ color: LINK }}>
			{href}
		</span>
	);
}

export function CuriaThread() {
	return (
		<div
			role="img"
			aria-label={
				"The #curia Discord channel on a phone, walking the golden thread: " +
				"a slash-frontier command answered with the takeable tickets across two repos, " +
				"slash-start on ticket 48 claiming it and spawning a worker in its own worktree, " +
				"the worker escalating a question back to the thread, the answer resuming it, " +
				"a preview link publishing the worker's dev server to the tailnet, " +
				"slash-attach returning a terminal URL for the same live session, " +
				"and the ticket resolving with the map updated and a pull request opened."
			}
			className="mb-6 flex justify-center"
		>
			<div
				aria-hidden="true"
				className="w-full max-w-[20rem] overflow-hidden rounded-[1.75rem] border-4 p-1.5 shadow-[0_10px_40px_rgba(0,0,0,0.45)]"
				style={{ backgroundColor: BG_PHONE, borderColor: "#0d0e10" }}
			>
				<div
					className="overflow-hidden rounded-[1.35rem]"
					style={{ backgroundColor: BG_CHAT }}
				>
					{/* Channel header */}
					<div
						className="flex items-center gap-2 px-3 py-2.5"
						style={{ backgroundColor: BG_CHROME }}
					>
						<span className="text-[15px]" style={{ color: TEXT_MUTED }}>
							#
						</span>
						<span
							className="text-[13px] font-semibold"
							style={{ color: TEXT_HEADER }}
						>
							curia
						</span>
						<span
							className="ml-auto inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest"
							style={{ color: GREEN }}
						>
							<span
								className="h-1.5 w-1.5 rounded-full"
								style={{ backgroundColor: GREEN }}
							/>
							Live
						</span>
					</div>

					<div className="px-3 py-2">
						<Divider leg={CURIA_LEGS[0]} />
						<Message author="Alp">
							<Slash command="/frontier" />
						</Message>
						<Message author="CuriaBot" bot>
							<div
								className="mb-1 text-[11px] font-bold"
								style={{ color: TEXT_MUTED }}
							>
								alp82/alperortac.com
							</div>
							<Ticket id="#48" title="Author subpage: Curia" />
							<Ticket id="#52" title="Card titles vs the heading tree" />
							<div
								className="mt-1.5 mb-1 text-[11px] font-bold"
								style={{ color: TEXT_MUTED }}
							>
								getalfredo/landing-page
							</div>
							<Ticket id="#88" title="Prototype: Day one two-column split" />
						</Message>

						<Divider leg={CURIA_LEGS[1]} />
						<Message author="Alp">
							<Slash command="/start" arg="48" />
						</Message>
						<Message author="CuriaBot" bot>
							<span style={{ color: LINK }}>#48</span> claimed · worktree carved
							off the base clone · worker live in{" "}
							<span className="font-mono">curia-48</span>
						</Message>

						<Divider leg={CURIA_LEGS[2]} />
						<Message author="CuriaBot" bot>
							<div
								className="rounded border-l-4 px-2.5 py-2"
								style={{ backgroundColor: BG_CHROME, borderColor: "#b4531f" }}
							>
								<div
									className="mb-1 text-[10px] font-bold uppercase tracking-widest"
									style={{ color: TEXT_MUTED }}
								>
									#48 asks
								</div>
								<div>
									Full flagship shape, or the lighter one claude-statusline set?
								</div>
							</div>
						</Message>

						<Divider leg={CURIA_LEGS[3]} />
						<Message author="Alp">flagship-lite. no video.</Message>
						<Message author="CuriaBot" bot>
							answered · worker resumed
						</Message>

						<Divider leg={CURIA_LEGS[4]} />
						<Message author="CuriaBot" bot>
							<div className="mb-1">preview ready</div>
							<Url href={PREVIEW_URL} />
						</Message>

						<Divider leg={CURIA_LEGS[5]} />
						<Message author="Alp">
							<Slash command="/attach" arg="48" />
						</Message>
						<Message author="CuriaBot" bot>
							<Url href={ATTACH_URL} />
						</Message>

						<Divider leg={CURIA_LEGS[6]} />
						<Message author="CuriaBot" bot>
							<span style={{ color: GREEN }}>✓</span>{" "}
							<span style={{ color: LINK }}>#48</span> resolved · map updated ·
							pull request opened
						</Message>
					</div>
				</div>
			</div>
		</div>
	);
}
