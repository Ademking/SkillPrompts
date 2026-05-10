import { useState, useRef, useEffect } from "react"

export function VariableModal({
    label,
    variables,
    template,
    theme,
    onSubmit,
    onClose,
}: {
    label: string
    variables: string[]
    template: string
    theme: "light" | "dark"
    onSubmit: (values: Record<string, string>) => void
    onClose: () => void
}) {
    const [values, setValues] = useState<Record<string, string>>({})
    const [focusedIdx, setFocusedIdx] = useState(0)
    const inputRefs = useRef<(HTMLInputElement | null)[]>([])

    useEffect(() => {
        inputRefs.current[focusedIdx]?.focus()
    }, [focusedIdx])

    const D = theme === "dark"

    const handleSubmit = () => {
        const filled: Record<string, string> = {}
        for (const v of variables) {
            filled[v] = values[v] || ""
        }
        onSubmit(filled)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault()
            if (focusedIdx >= variables.length - 1) {
                handleSubmit()
            } else {
                setFocusedIdx(i => i + 1)
            }
            return
        }
        if (e.key === "Escape") {
            onClose()
        }
    }

    const scrollVars = D
        ? { "--scroll-track": "rgba(255,255,255,0.04)", "--scroll-thumb": "rgba(255,255,255,0.16)" }
        : { "--scroll-track": "rgba(0,0,0,0.04)", "--scroll-thumb": "rgba(0,0,0,0.12)" }

    const borderCls = D ? "plasmo-border-white/10" : "plasmo-border-black/5"
    const textMuted = D ? "plasmo-text-neutral-500" : "plasmo-text-neutral-400"
    const textMuted2 = D ? "plasmo-text-neutral-400" : "plasmo-text-neutral-500"

    return (
        <div
            className="plasmo-fixed plasmo-inset-0 plasmo-z-[10001] plasmo-flex plasmo-items-center plasmo-justify-center plasmo-p-4"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
            onKeyDown={handleKeyDown}
            onClick={onClose}
        >
            <div
                className="plasmo-w-full plasmo-max-w-lg"
                onClick={e => e.stopPropagation()}
            >
                <div className={`plasmo-overflow-hidden plasmo-border plasmo-backdrop-blur-2xl plasmo-shadow-[0_24px_80px_rgba(0,0,0,0.45)] ${D ? "plasmo-border-white/10 plasmo-bg-neutral-950/96 plasmo-text-white" : "plasmo-border-black/10 plasmo-bg-white/95 plasmo-text-neutral-900"}`}>
                    <style>{`
                        .var-modal-scroll::-webkit-scrollbar { width: 10px; height: 10px; }
                        .var-modal-scroll::-webkit-scrollbar-track { background: var(--scroll-track); }
                        .var-modal-scroll::-webkit-scrollbar-thumb { background-color: var(--scroll-thumb); border: 3px solid var(--scroll-track); border-radius: 999px; }
                        .var-modal-scroll::-webkit-scrollbar-thumb:hover { background-color: ${D ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.24)"}; }
                        .var-modal-scroll { scrollbar-width: thin; scrollbar-color: var(--scroll-thumb) var(--scroll-track); }
                    `}</style>

                    {/* HEADER */}
                    <div className={`plasmo-flex plasmo-items-center plasmo-justify-between plasmo-border-b plasmo-px-3 plasmo-py-2.5 ${borderCls}`}>
                        <div className="plasmo-flex plasmo-items-center plasmo-gap-2.5">
                            <div className={`plasmo-flex plasmo-h-8 plasmo-w-8 plasmo-items-center plasmo-justify-center plasmo-border plasmo-text-xs plasmo-font-semibold ${D ? "plasmo-border-white/10 plasmo-bg-white/5 plasmo-text-neutral-300" : "plasmo-border-black/5 plasmo-bg-neutral-100 plasmo-text-neutral-600"}`}>
                                /
                            </div>
                            <div>
                                <span className={`plasmo-text-sm plasmo-font-semibold ${D ? "plasmo-text-white" : "plasmo-text-neutral-900"}`}>
                                    {label}
                                </span>
                                <div className={`plasmo-text-[11px] ${textMuted}`}>
                                    {variables.length} variable{variables.length > 1 ? "s" : ""} · Fill in the values
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className={`plasmo-flex plasmo-h-8 plasmo-w-8 plasmo-items-center plasmo-justify-center plasmo-text-xs ${D ? "plasmo-text-neutral-500 hover:plasmo-bg-white/5 hover:plasmo-text-white" : "plasmo-text-neutral-400 hover:plasmo-bg-neutral-100 hover:plasmo-text-neutral-900"}`}
                        >
                            ✕
                        </button>
                    </div>

                    {/* VARIABLE LIST */}
                    <div className="plasmo-max-h-[360px] plasmo-overflow-y-auto plasmo-p-3 var-modal-scroll" style={scrollVars as React.CSSProperties}>
                        <div className="plasmo-space-y-2">
                            {variables.map((v, i) => (
                                <div key={v} className="plasmo-flex plasmo-flex-col plasmo-gap-1">
                                    <label className={`plasmo-text-[11px] plasmo-font-medium plasmo-uppercase plasmo-tracking-widest ${D ? "plasmo-text-neutral-400" : "plasmo-text-neutral-500"}`}>
                                        {v}
                                    </label>
                                    <input
                                        ref={el => { inputRefs.current[i] = el }}
                                        value={values[v] || ""}
                                        onChange={e => setValues(x => ({ ...x, [v]: e.target.value }))}
                                        onFocus={() => setFocusedIdx(i)}
                                        placeholder={`Enter ${v}...`}
                                        className={`plasmo-w-full plasmo-px-3 plasmo-py-2 plasmo-text-sm plasmo-outline-none plasmo-transition-all plasmo-duration-150 ${D
                                            ? "plasmo-bg-white/5 plasmo-border plasmo-border-white/10 plasmo-text-white placeholder:plasmo-text-neutral-500 focus:plasmo-border-blue-500/50"
                                            : "plasmo-bg-neutral-50 plasmo-border plasmo-border-black/10 plasmo-text-neutral-900 placeholder:plasmo-text-neutral-400 focus:plasmo-border-blue-500"
                                            }`}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* FOOTER */}
                    <div className={`plasmo-flex plasmo-items-center plasmo-justify-between plasmo-border-t plasmo-px-3 plasmo-py-2 plasmo-text-[11px] ${borderCls} ${textMuted}`}>
                        <div className="plasmo-flex plasmo-items-center plasmo-gap-3">
                            <span>↵ Next</span>
                            <span>Esc Close</span>
                        </div>
                        <div className="plasmo-flex plasmo-items-center plasmo-gap-2">
                            <button
                                onClick={onClose}
                                className={`plasmo-h-8 plasmo-px-3 plasmo-text-xs plasmo-font-medium plasmo-transition-colors ${D ? "plasmo-text-neutral-400 hover:plasmo-text-white" : "plasmo-text-neutral-500 hover:plasmo-text-neutral-900"}`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="plasmo-inline-flex plasmo-items-center plasmo-gap-1.5 plasmo-h-8 plasmo-px-4 plasmo-text-xs plasmo-font-semibold plasmo-text-white plasmo-bg-blue-600 plasmo-transition-all hover:plasmo-opacity-90 active:plasmo-scale-[0.97]"
                            >
                                Insert
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
