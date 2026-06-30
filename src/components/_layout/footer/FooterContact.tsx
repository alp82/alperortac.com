import { Check, Copy, Mail } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
	CONTACT_EMAIL,
	CONTACT_PLACEHOLDER,
	CONTACT_SUBJECT,
} from "../../../data/footer";

export function FooterContact() {
	const [message, setMessage] = useState("");
	const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
		undefined,
	);

	useEffect(
		() => () => {
			clearTimeout(timeoutRef.current);
		},
		[],
	);

	async function handleCopyEmail(): Promise<void> {
		try {
			await navigator.clipboard.writeText(CONTACT_EMAIL);
			setStatus("copied");
		} catch {
			setStatus("error");
		}
		clearTimeout(timeoutRef.current);
		timeoutRef.current = setTimeout(() => setStatus("idle"), 2000);
	}

	const mailtoHref = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(CONTACT_SUBJECT)}&body=${encodeURIComponent(message)}`;

	return (
		<div className="flex flex-col gap-4">
			<label htmlFor="contact-message" className="sr-only">
				Your message
			</label>
			<textarea
				id="contact-message"
				value={message}
				onChange={(e) => setMessage(e.target.value)}
				placeholder={CONTACT_PLACEHOLDER}
				rows={4}
				className="w-full bg-white/5 border-2 border-current/50 px-4 py-3 text-base text-current placeholder:text-current/50 resize-y focus:outline-none focus-visible:ring-2 focus-visible:ring-current"
			/>
			<div className="flex flex-wrap items-center gap-x-6 gap-y-4">
				<a
					href={mailtoHref}
					className="inline-flex items-center gap-3 bg-white text-slate-900 px-6 py-4 font-black uppercase text-sm tracking-widest shadow-[6px_6px_0px_0px_rgba(255,255,255,0.4)] hover:-translate-y-1 transition-transform focus-visible:ring-2 focus-visible:ring-current focus-visible:outline-none"
				>
					<Mail size={18} aria-hidden="true" />
					Email me
				</a>
				<p className="inline-flex items-center gap-2 text-sm text-current">
					<span className="opacity-60">or write to </span>
					<span className="select-all font-medium">{CONTACT_EMAIL}</span>
					<button
						type="button"
						onClick={handleCopyEmail}
						aria-label="Copy email address"
						title="Copy email address"
						className="inline-flex items-center justify-center rounded-sm p-1 -m-1 opacity-60 hover:opacity-100 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current cursor-pointer"
					>
						{status === "copied" ? (
							<Check size={16} aria-hidden="true" />
						) : (
							<Copy size={16} aria-hidden="true" />
						)}
					</button>
					{/* biome-ignore lint/a11y/useSemanticElements: an explicit role="status" span is the queryable live region the contract pins; <output> carries a different implicit semantics here. */}
					<span role="status" aria-live="polite" className="sr-only">
						{status === "copied"
							? "Email address copied"
							: status === "error"
								? "Could not copy - select the address above"
								: ""}
					</span>
				</p>
			</div>
		</div>
	);
}
