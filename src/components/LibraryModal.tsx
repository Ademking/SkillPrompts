import { useEffect, useMemo, useRef, useState } from "react"
import type { LibraryPrompt } from "~types"
import { Icons } from "~components/Icons"
import libraryPrompts from "~prompts.json"

export function LibraryModal({ onImport, onClose, existingLabels }: { onImport: (p: LibraryPrompt) => void; onClose: () => void; existingLabels: Set<string> }) {
    const [search, setSearch] = useState("")
    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim()
        return !q ? libraryPrompts : (libraryPrompts as LibraryPrompt[]).filter(p =>
            p.label.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q) ||
            p.prompt.toLowerCase().includes(q)
        )
    }, [search])

    const inputRef = useRef<HTMLInputElement>(null)
    useEffect(() => { setTimeout(() => inputRef.current?.focus(), 80) }, [])

    return (
        <div
            className="plasmo-fixed plasmo-inset-0 plasmo-z-50 plasmo-flex plasmo-items-center plasmo-justify-center plasmo-p-4 modal-overlay"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(12px)" }}
            onClick={onClose}
        >
            <div
                className="plasmo-w-full plasmo-max-w-2xl modal-content plasmo-max-h-[80vh] plasmo-flex plasmo-flex-col"
                onClick={e => e.stopPropagation()}
                onKeyDown={e => { if (e.key === "Escape") onClose() }}
            >
                <div className="plasmo-border plasmo-border-[var(--border-hover)] plasmo-bg-[var(--card)] plasmo-shadow-[0_24px_64_var(--shadow)] plasmo-overflow-hidden plasmo-flex plasmo-flex-col plasmo-max-h-full">
                    <div className="plasmo-flex plasmo-items-center plasmo-justify-between plasmo-px-5 plasmo-py-2 plasmo-border-b plasmo-border-[var(--border)]">
                        <div className="plasmo-flex plasmo-items-center plasmo-gap-2.5">
                            <div className="plasmo-w-2 plasmo-h-2 plasmo-bg-[var(--accent)]" />
                            <span className="plasmo-text-[14px] plasmo-font-semibold plasmo-text-[var(--text)]">Prompt Library</span>
                        </div>
                        <button onClick={onClose} className="plasmo-flex plasmo-h-8 plasmo-w-8 plasmo-items-center plasmo-justify-center plasmo-text-[var(--muted)] plasmo-transition-colors hover:plasmo-bg-[var(--hover)] hover:plasmo-text-[var(--text)]">
                            <Icons.x />
                        </button>
                    </div>
                    <div className="plasmo-p-4 plasmo-border-b plasmo-border-[var(--border)]">
                        <div className="plasmo-relative">
                            <div className="plasmo-absolute plasmo-left-3 plasmo-top-1/2 plasmo--translate-y-1/2 plasmo-text-[var(--dim)] plasmo-pointer-events-none"><Icons.search /></div>
                            <input
                                ref={inputRef}
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search library..."
                                className="plasmo-w-full plasmo-pl-9 plasmo-pr-3 plasmo-py-2 plasmo-border plasmo-border-[var(--border)] plasmo-bg-[var(--input-bg)] plasmo-text-[13px] plasmo-text-[var(--text)] plasmo-outline-none plasmo-transition-all plasmo-duration-150 focus:plasmo-border-[var(--accent)] focus:plasmo-ring-2 focus:plasmo-ring-[var(--accent-bg)] placeholder:plasmo-text-[var(--dim)]"
                            />
                        </div>
                    </div>
                    <div className="plasmo-overflow-auto plasmo-flex-1">
                        {filtered.length === 0 ? (
                            <div className="plasmo-flex plasmo-items-center plasmo-justify-center plasmo-py-16 plasmo-text-[13px] plasmo-text-[var(--muted)]">No prompts found</div>
                        ) : (
                            filtered.map((p, i) => {
                                const alreadyImported = existingLabels.has(p.label.toLowerCase())
                                return (
                                    <div key={i} className="plasmo-flex plasmo-items-start plasmo-gap-3 plasmo-px-5 plasmo-py-3.5 plasmo-border-b plasmo-border-[var(--border)] plasmo-transition-colors hover:plasmo-bg-[var(--hover)]">
                                        <div className="plasmo-min-w-0 plasmo-flex-1">
                                            <span className="plasmo-text-[13px] plasmo-font-semibold plasmo-text-[var(--accent)] plasmo-bg-[var(--accent-bg)] plasmo-px-1 plasmo-py-0.5">/{p.label}</span>
                                            <p className="plasmo-text-[11.5px] plasmo-text-[var(--muted)] plasmo-mt-0.5 plasmo-line-clamp-1">{p.description}</p>
                                        </div>
                                        <button
                                            onClick={() => onImport(p)}
                                            disabled={alreadyImported}
                                            className={`plasmo-flex plasmo-shrink-0 plasmo-h-7 plasmo-px-3 plasmo-items-center plasmo-justify-center plasmo-gap-1.5 plasmo-text-[11px] plasmo-font-medium plasmo-transition-all plasmo-duration-200 ${alreadyImported
                                                ? "plasmo-text-emerald-500 plasmo-bg-emerald-500/10 plasmo-cursor-default"
                                                : "plasmo-text-[var(--muted)] plasmo-border plasmo-border-[var(--border)] hover:plasmo-bg-[var(--hover)] hover:plasmo-text-[var(--text)]"
                                                }`}
                                        >
                                            {alreadyImported ? <><Icons.check /> Imported</> : <><Icons.download /> Import</>}
                                        </button>
                                    </div>
                                )
                            })
                        )}
                    </div>
                    <div className="plasmo-flex plasmo-items-center plasmo-justify-between plasmo-px-5 plasmo-py-3 plasmo-border-t plasmo-border-[var(--border)] plasmo-bg-[var(--hover)]">
                        <span className="plasmo-text-[11px] plasmo-text-[var(--dim)]">{filtered.length} of {libraryPrompts.length} prompts</span>
                        <button onClick={onClose} className="plasmo-h-8 plasmo-px-4 plasmo-border plasmo-border-[var(--border)] plasmo-text-[12px] plasmo-font-medium plasmo-text-[var(--muted)] plasmo-transition-colors hover:plasmo-bg-[var(--hover)] hover:plasmo-text-[var(--text)]">Close</button>
                    </div>
                </div>
            </div>
        </div>
    )
}
