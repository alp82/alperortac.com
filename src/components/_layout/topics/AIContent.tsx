import {
	InlineLink,
	Paragraph,
	type TopicContentProps,
	TriggerCard,
} from "./primitives";

export function AIContent({ lastTriggerRef, isNight }: TopicContentProps) {
	return (
		<div className="space-y-5">
			<Paragraph>
				I love coding in my free time. Usually I use Claude Code to build my
				side projects. The pre-AI era feels so far away already, it's difficult
				to imagine to ever write everything by hand again. That also means that
				I'm constantly on the verge to optimize my agentic coding workflow.
			</Paragraph>

			<Paragraph>
				I open sourced my Claude Code setup as a plugin because I genuinely
				think it has some unique qualities. First of all, it automatically
				classifies each task by complexity: S, M, L or XL. It then spawns an
				appropriate number of subagents to do research, planning, execution and
				reviewing.
			</Paragraph>

			<div className="space-y-3">
				<p className="text-base md:text-lg font-medium">Check it out:</p>
				<TriggerCard
					trigger={{ kind: "project", slug: "forge" }}
					lastTriggerRef={lastTriggerRef}
				/>
			</div>

			<Paragraph>
				Claude Code is my main driver and it costs me $200 per month. It's well
				worth it because it gets so much done for me. I created a page to share
				more details about their AI stack (
				<InlineLink href="https://aistack.to" isNight={isNight}>
					aistack.to
				</InlineLink>
				). It grows into a nice community of like-minded builders.
			</Paragraph>

			<TriggerCard
				trigger={{ kind: "project", slug: "aistack" }}
				lastTriggerRef={lastTriggerRef}
			/>
		</div>
	);
}
