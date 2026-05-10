import type { Prompt } from "~types"
import { Icons } from "~components/Icons"

function varCount(template: string): number {
    const matches = template.match(/\{\{\s*\w+\s*\}\}/g)
    if (!matches) return 0
    const names = matches.map(m => m.replace(/\{\{\s*/, '').replace(/\s*\}\}/, ''))
    return new Set(names).size
}

export function PromptCard({
    prompt, onCopy, onEdit, onDelete, onView, copiedId, usage,
}: {
    prompt: Prompt; onCopy: (p: Prompt) => void; onEdit: (p: Prompt) => void; onDelete: (id: string) => void; onView: (p: Prompt) => void; copiedId: string | null; usage?: number
}) {
    const isCopied = copiedId === prompt.id
    const vc = varCount(prompt.template)
    const uc = usage || 0
    return (
        <div className="plasmo-group plasmo-relative plasmo-flex plasmo-flex-col  plasmo-border plasmo-border-[var(--border)] plasmo-bg-[var(--card)] plasmo-overflow-hidden plasmo-transition-all plasmo-duration-200 hover:plasmo-border-[var(--border-hover)] hover:plasmo-shadow-[0_8px_32px_var(--shadow)] hover:plasmo--translate-y-0.5">
            <div className="plasmo-flex plasmo-items-start plasmo-justify-between plasmo-gap-2 plasmo-px-4 plasmo-pt-3 plasmo-pb-2">
                <div className="plasmo-min-w-0 plasmo-flex-1">
                    <div className="plasmo-flex plasmo-items-center plasmo-gap-1.5">
                        <span className="plasmo-text-[13px] plasmo-font-semibold plasmo-text-[var(--accent)] plasmo-bg-[var(--accent-bg)] plasmo-px-1 plasmo-py-0.5
                        plasmo-text-ellipsis plasmo-overflow-hidden plasmo-whitespace-nowrap
                        ">
                            /{prompt.label}
                        </span>
                    </div>

                    <span className="plasmo-text-[11px] plasmo-text-[var(--muted)] plasmo-line-clamp-1">{prompt.description || ""}</span>
                </div>

                <div className="plasmo-flex plasmo-shrink-0 plasmo-items-center plasmo-gap-0 plasmo-opacity-0 group-hover:plasmo-opacity-100 plasmo-transition-opacity">
                    <button
                        onClick={() => onView(prompt)}
                        className="plasmo-flex plasmo-h-6 plasmo-w-6 plasmo-items-center plasmo-justify-center plasmo-text-[var(--muted)] hover:plasmo-bg-[var(--hover)] hover:plasmo-text-[var(--text)]"
                        aria-label="View"
                    >
                        <Icons.eye />
                    </button>
                    <button
                        onClick={() => onEdit(prompt)}
                        className="plasmo-flex plasmo-h-6 plasmo-w-6 plasmo-items-center plasmo-justify-center plasmo-text-[var(--muted)] hover:plasmo-bg-[var(--hover)] hover:plasmo-text-[var(--text)]"
                        aria-label="Edit"
                    >
                        <Icons.edit />
                    </button>

                    <button
                        onClick={() => onDelete(prompt.id)}
                        className="plasmo-flex plasmo-h-6 plasmo-w-6 plasmo-items-center plasmo-justify-center plasmo-text-[var(--muted)] hover:plasmo-bg-red-500/10 hover:plasmo-text-red-500"
                        aria-label="Delete"
                    >
                        <Icons.trash />
                    </button>
                </div>
            </div>

            <div className="plasmo-mb-3 plasmo-min-w-[260px]">

                <pre
                    className="
      plasmo-px-3 plasmo-py-3
      plasmo-bg-[var(--code-bg)]
      plasmo-font-mono
      plasmo-text-[11px]
      plasmo-leading-relaxed
      plasmo-text-[var(--muted)]
      plasmo-border-t
      plasmo-border-b
      plasmo-border-[var(--border)]
      plasmo-overflow-auto
      plasmo-max-h-[80px]
      plasmo-min-h-[80px]
      plasmo-whitespace-pre-wrap
      plasmo-break-words
      plasmo-scrollbar-thin
    "
                    style={{
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                    }}
                >
                    {prompt.template.split(/(\{\{\s*\w+\s*\}\})/g).map((seg, i) => {
                        const m = seg.match(/^\{\{\s*(\w+)\s*\}\}$/)
                        if (m) {
                            const name = m[1].toUpperCase()
                            return <span key={i} className="plasmo-inline-flex plasmo-items-center plasmo-px-1.5 plasmo-py-0 plasmo-text-[10px] plasmo-font-semibold plasmo-leading-tight plasmo-bg-amber-500/15 plasmo-text-amber-400 plasmo-border plasmo-border-amber-500/20">{name}</span>
                        }
                        return seg
                    })}
                </pre>

            </div>

            <div className="plasmo-flex plasmo-items-center plasmo-gap-2.5 plasmo-px-4 plasmo-pb-3">
                <span className="plasmo-inline-flex plasmo-items-center plasmo-gap-1 plasmo-text-[10px] plasmo-font-medium plasmo-text-amber-400/70">
                    <svg width="10" height="10" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 1L6 4L2 7" /></svg>
                    Variables: {vc}
                </span>
                <span className="plasmo-inline-flex plasmo-items-center plasmo-gap-1 plasmo-text-[10px] plasmo-font-medium plasmo-text-blue-400/60">
                    <svg width="10" height="10" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="4" cy="4" r="3" /></svg>
                    Usage: {uc}
                </span>
            </div>

            <div className="plasmo-px-4 plasmo-pb-3 plasmo-mt-auto">
                <button
                    onClick={() => onCopy(prompt)}
                    className={`plasmo-flex plasmo-h-9 plasmo-w-full plasmo-items-center plasmo-justify-center plasmo-gap-1.5  plasmo-text-xs plasmo-font-medium plasmo-transition-all plasmo-duration-200 ${isCopied
                        ? "plasmo-bg-emerald-500/10 plasmo-text-emerald-500 plasmo-border plasmo-border-emerald-500/20"
                        : "plasmo-bg-[var(--hover)] plasmo-text-[var(--muted)] plasmo-border plasmo-border-[var(--border)] hover:plasmo-border-[var(--border-hover)] hover:plasmo-text-[var(--text)] hover:plasmo-bg-[var(--card)]"
                        }`}
                >
                    {isCopied ? <><Icons.check /> Copied</> : <><Icons.copy /> Copy Prompt</>}
                </button>
            </div>
        </div>
    )
}
