import type { Prompt } from "~types"
import { Icons } from "~components/Icons"

export function ViewPromptModal({ prompt, onClose }: { prompt: Prompt | null; onClose: () => void }) {
    if (!prompt) return null
    return (
        <div
            className="plasmo-fixed plasmo-inset-0 plasmo-z-50 plasmo-flex plasmo-items-center plasmo-justify-center plasmo-p-4 modal-overlay"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
            onClick={onClose}
        >
            <div
                className="plasmo-w-full plasmo-max-w-2xl modal-content"
                onClick={e => e.stopPropagation()}
            >
                <div className="plasmo-border plasmo-border-[var(--border-hover)] plasmo-bg-[var(--card)] plasmo-shadow-[0_24px_64px_var(--shadow)] plasmo-overflow-hidden">
                    <div className="plasmo-flex plasmo-items-center plasmo-justify-between plasmo-px-5 plasmo-py-2 plasmo-border-b plasmo-border-[var(--border)]">
                        <div className="plasmo-flex plasmo-items-center plasmo-gap-2.5">
                            <div className="plasmo-w-2 plasmo-h-2 plasmo-bg-[var(--accent)]" />
                            <span className="plasmo-text-[14px] plasmo-font-semibold plasmo-text-[var(--text)]">
                                /{prompt.label}
                            </span>
                        </div>
                        <button onClick={onClose} className="plasmo-flex plasmo-h-8 plasmo-w-8 plasmo-items-center plasmo-justify-center plasmo-text-[var(--muted)] plasmo-transition-colors hover:plasmo-bg-[var(--hover)] hover:plasmo-text-[var(--text)]">
                            <Icons.x />
                        </button>
                    </div>
                    <div className="plasmo-p-5 plasmo-flex plasmo-flex-col plasmo-gap-4">
                        <div>
                            <label className="plasmo-text-[11px] plasmo-font-medium plasmo-text-[var(--muted)] plasmo-uppercase plasmo-tracking-widest plasmo-block plasmo-mb-1.5">Command</label>
                            <span className="plasmo-text-[13px] plasmo-font-semibold plasmo-text-[var(--accent)] plasmo-bg-[var(--accent-bg)] plasmo-px-1 plasmo-py-0.5">/{prompt.label}</span>
                        </div>
                        {prompt.description && (
                            <div>
                                <label className="plasmo-text-[11px] plasmo-font-medium plasmo-text-[var(--muted)] plasmo-uppercase plasmo-tracking-widest plasmo-block plasmo-mb-1.5">Description</label>
                                <p className="plasmo-text-[13px] plasmo-text-[var(--text)]">{prompt.description}</p>
                            </div>
                        )}
                        <div>
                            <label className="plasmo-text-[11px] plasmo-font-medium plasmo-text-[var(--muted)] plasmo-uppercase plasmo-tracking-widest plasmo-block plasmo-mb-1.5">Prompt</label>
                            <pre className="plasmo-px-4 plasmo-py-3 plasmo-bg-[var(--code-bg)] plasmo-font-mono plasmo-text-[12px] plasmo-leading-relaxed plasmo-text-[var(--text)] plasmo-border plasmo-border-[var(--border)] plasmo-overflow-auto plasmo-max-h-[400px] plasmo-whitespace-pre-wrap plasmo-break-words plasmo-scrollbar-thin" style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{prompt.template}</pre>
                        </div>
                    </div>
                    <div className="plasmo-flex plasmo-items-center plasmo-justify-end plasmo-px-5 plasmo-py-2 plasmo-border-t plasmo-border-[var(--border)] plasmo-bg-[var(--hover)]">
                        <button onClick={onClose} className="plasmo-h-9 plasmo-px-4 plasmo-border plasmo-border-[var(--border)] plasmo-text-[12px] plasmo-font-medium plasmo-text-[var(--muted)] plasmo-transition-colors hover:plasmo-bg-[var(--hover)] hover:plasmo-text-[var(--text)]">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
