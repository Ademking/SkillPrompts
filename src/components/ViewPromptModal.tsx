import type { Prompt, Block } from "~types"
import { Icons } from "~components/Icons"
import { resolveBlocks, blockNames } from "~utils"

function varCount(template: string, blocks: Block[]): number {
    const resolved = resolveBlocks(template, blocks)
    const matches = resolved.match(/\{\{\s*[\w-]+\s*\}\}/g)
    if (!matches) return 0
    const names = matches.map(m => m.replace(/\{\{\s*/, '').replace(/\s*\}\}/, ''))
    return new Set(names).size
}

export function ViewPromptModal({ prompt, onClose, blocks = [] }: { prompt: Prompt | null; onClose: () => void; blocks?: Block[] }) {
    if (!prompt) return null
    const vc = varCount(prompt.template, blocks)
    return (
        <div
            className="plasmo-fixed plasmo-inset-0 plasmo-z-50 plasmo-flex plasmo-items-center plasmo-justify-center plasmo-p-4 modal-overlay"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
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
                            {vc > 0 && (
                                <span className="plasmo-text-[11px] plasmo-text-[var(--dim)]">
                                    · {vc} var{vc > 1 ? "s" : ""}
                                </span>
                            )}
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
                            <pre className="plasmo-px-4 plasmo-py-3 plasmo-bg-[var(--code-bg)] plasmo-font-mono plasmo-text-[12px] plasmo-leading-relaxed plasmo-text-[var(--text)] plasmo-border plasmo-border-[var(--border)] plasmo-overflow-auto plasmo-max-h-[400px] plasmo-whitespace-pre-wrap plasmo-break-words plasmo-scrollbar-thin" style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                                {resolveBlocks(prompt.template, blocks).split(/(\{\{\s*[\w-]+\s*\}\})/g).map((seg, i) => {
                                    const m = seg.match(/^\{\{\s*([\w-]+)\s*\}\}$/)
                                    if (m) {
                                        const name = m[1].toUpperCase()
                                        return <span key={i} className="plasmo-inline-flex plasmo-items-center plasmo-px-1.5 plasmo-py-0 plasmo-text-[10px] plasmo-font-semibold plasmo-leading-tight plasmo-bg-amber-500/15 plasmo-text-amber-400 plasmo-border plasmo-border-amber-500/20">{name}</span>
                                    }
                                    return seg
                                })}
                            </pre>
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
