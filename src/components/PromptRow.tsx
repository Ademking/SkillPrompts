import type { Prompt } from "~types"
import { Icons } from "~components/Icons"

function varCount(template: string): number {
    const matches = template.match(/\{\{\s*\w+\s*\}\}/g)
    if (!matches) return 0
    const names = matches.map(m => m.replace(/\{\{\s*/, '').replace(/\s*\}\}/, ''))
    return new Set(names).size
}

export function PromptRow({
    prompt, onCopy, onEdit, onDelete, onView, copiedId, usage,
}: {
    prompt: Prompt; onCopy: (p: Prompt) => void; onEdit: (p: Prompt) => void; onDelete: (id: string) => void; onView: (p: Prompt) => void; copiedId: string | null; usage?: number
}) {
    const isCopied = copiedId === prompt.id
    const vc = varCount(prompt.template)
    const uc = usage || 0
    return (
        <div className="plasmo-flex plasmo-items-stretch plasmo-min-h-0 plasmo-transition-colors plasmo-duration-150 hover:plasmo-bg-[var(--hover)]">
            <div className="plasmo-flex plasmo-items-start plasmo-gap-4 plasmo-px-5 plasmo-py-3.5 plasmo-flex-1 plasmo-min-w-0">
                <div className="plasmo-min-w-0 plasmo-flex-[2]">
                    <span className="plasmo-text-[14px] plasmo-font-semibold plasmo-text-[var(--accent)] plasmo-bg-[var(--accent-bg)] plasmo-px-1.5 plasmo-py-0.5">/{prompt.label}</span>
                    <p className="plasmo-text-[12px] plasmo-text-[var(--muted)] plasmo-mt-0.5 plasmo-truncate">{prompt.description || ""}</p>
                </div>

                <div className="plasmo-flex-[3] plasmo-flex plasmo-flex-col plasmo-min-w-0">
                    <pre className="plasmo-min-w-0 plasmo-px-3.5 plasmo-py-1 plasmo-bg-[var(--code-bg)] plasmo-font-mono plasmo-text-[12px] plasmo-leading-relaxed plasmo-text-[var(--muted)] plasmo-overflow-hidden plasmo-truncate">
                        {prompt.template.split(/(\{\{\s*\w+\s*\}\})/g).map((seg, i) => {
                            const m = seg.match(/^\{\{\s*(\w+)\s*\}\}$/)
                            if (m) {
                                const name = m[1].toUpperCase()
                                return <span key={i} className="plasmo-inline-flex plasmo-items-center plasmo-px-1.5 plasmo-py-0 plasmo-text-[10px] plasmo-font-semibold plasmo-leading-tight plasmo-bg-amber-500/15 plasmo-text-amber-400 plasmo-border plasmo-border-amber-500/20">{name}</span>
                            }
                            return seg
                        })}
                    </pre>
                    <div className="plasmo-flex plasmo-items-center plasmo-gap-3 plasmo-px-3.5 plasmo-pt-2 plasmo-pb-0">
                        <span className="plasmo-inline-flex plasmo-items-center plasmo-gap-1 plasmo-text-[10px] plasmo-font-medium plasmo-text-orange-400/70">
                            <svg width="10" height="10" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 1L6 4L2 7" /></svg>
                            Variables: {vc}
                        </span>
                        <span className="plasmo-inline-flex plasmo-items-center plasmo-gap-1 plasmo-text-[10px] plasmo-font-medium plasmo-text-blue-400/60">
                            <svg width="10" height="10" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="4" cy="4" r="3" /></svg>
                            Usage: {uc}
                        </span>
                    </div>
                </div>
            </div>

            <div className="plasmo-flex plasmo-items-center plasmo-gap-0.5 plasmo-px-2 plasmo-border-l plasmo-border-[var(--border)]">
                <button
                    onClick={() => onCopy(prompt)}
                    className={`plasmo-flex plasmo-h-8 plasmo-px-3 plasmo-items-center plasmo-justify-center plasmo-gap-1.5 plasmo-text-[11px] plasmo-font-medium plasmo-transition-all plasmo-duration-200 ${isCopied
                        ? "plasmo-bg-emerald-500/10 plasmo-text-emerald-500"
                        : "plasmo-text-[var(--muted)] hover:plasmo-bg-[var(--hover)] hover:plasmo-text-[var(--text)]"
                        }`}
                >
                    {isCopied ? <Icons.check /> : <Icons.copy />}
                </button>
                <button onClick={() => onView(prompt)} className="plasmo-flex plasmo-h-8 plasmo-w-8 plasmo-items-center plasmo-justify-center plasmo-text-[var(--muted)] plasmo-transition-colors hover:plasmo-bg-[var(--hover)] hover:plasmo-text-[var(--text)]" aria-label="View">
                    <Icons.eye />
                </button>
                <button onClick={() => onEdit(prompt)} className="plasmo-flex plasmo-h-8 plasmo-w-8 plasmo-items-center plasmo-justify-center plasmo-text-[var(--muted)] plasmo-transition-colors hover:plasmo-bg-[var(--hover)] hover:plasmo-text-[var(--text)]" aria-label="Edit">
                    <Icons.edit />
                </button>
                <button onClick={() => onDelete(prompt.id)} className="plasmo-flex plasmo-h-8 plasmo-w-8 plasmo-items-center plasmo-justify-center plasmo-text-[var(--muted)] plasmo-transition-colors hover:plasmo-bg-red-500/10 hover:plasmo-text-red-500" aria-label="Delete">
                    <Icons.trash />
                </button>
            </div>
        </div>
    )
}
