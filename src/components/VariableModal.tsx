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
                <div className={`plasmo-overflow-hidden plasmo-border plasmo-shadow-[0_24px_64px_rgba(0,0,0,0.5)] ${D ? "plasmo-border-white/10 plasmo-bg-neutral-950 plasmo-text-white" : "plasmo-border-black/10 plasmo-bg-white plasmo-text-neutral-900"}`}>
                    <style>{`
                        .var-modal-scroll::-webkit-scrollbar { width: 8px; height: 8px; }
                        .var-modal-scroll::-webkit-scrollbar-track { background: var(--scroll-track); }
                        .var-modal-scroll::-webkit-scrollbar-thumb { background-color: var(--scroll-thumb); border: 2px solid var(--scroll-track); border-radius: 999px; }
                        .var-modal-scroll::-webkit-scrollbar-thumb:hover { background-color: ${D ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.24)"}; }
                        .var-modal-scroll { scrollbar-width: thin; scrollbar-color: var(--scroll-thumb) var(--scroll-track); }
                    `}</style>
                    <div className={`plasmo-flex plasmo-items-center plasmo-justify-between plasmo-px-5 plasmo-py-3 plasmo-border-b ${D ? "plasmo-border-white/10" : "plasmo-border-black/10"}`}>
                        <div className="plasmo-flex plasmo-items-center plasmo-gap-2.5">
                            <div className={`plasmo-w-2 plasmo-h-2 ${D ? "plasmo-bg-blue-500" : "plasmo-bg-blue-600"}`} />
                            <span className="plasmo-text-sm plasmo-font-semibold">
                                /{label}
                            </span>
                        </div>
                        <button
                            onClick={onClose}
                            className={`plasmo-flex plasmo-h-7 plasmo-w-7 plasmo-items-center plasmo-justify-center plasmo-text-xs ${D ? "plasmo-text-neutral-500 hover:plasmo-bg-white/5 hover:plasmo-text-white" : "plasmo-text-neutral-400 hover:plasmo-bg-neutral-100 hover:plasmo-text-neutral-900"}`}
                        >
                            ✕
                        </button>
                    </div>

                    <div className="plasmo-p-5 plasmo-flex plasmo-flex-col plasmo-gap-4 plasmo-max-h-[60vh] plasmo-overflow-y-auto var-modal-scroll" style={scrollVars as React.CSSProperties}>
                        <p className={`plasmo-text-xs ${D ? "plasmo-text-neutral-400" : "plasmo-text-neutral-500"}`}>
                            Fill in the variables for this command
                        </p>

                        {variables.map((v, i) => (
                            <div key={v} className="plasmo-flex plasmo-flex-col plasmo-gap-1.5">
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
                                        ? "plasmo-bg-white/5 plasmo-border plasmo-border-white/10 plasmo-text-white placeholder:plasmo-text-neutral-600 focus:plasmo-border-blue-500/50"
                                        : "plasmo-bg-neutral-50 plasmo-border plasmo-border-black/10 plasmo-text-neutral-900 placeholder:plasmo-text-neutral-400 focus:plasmo-border-blue-500"
                                        }`}
                                />
                            </div>
                        ))}

                    </div>

                    <div className={`plasmo-flex plasmo-items-center plasmo-justify-end plasmo-gap-2 plasmo-px-5 plasmo-py-3 plasmo-border-t ${D ? "plasmo-border-white/10 plasmo-bg-white/[0.02]" : "plasmo-border-black/5 plasmo-bg-neutral-50"}`}>
                        <button
                            onClick={onClose}
                            className={`plasmo-h-8 plasmo-px-4 plasmo-text-xs plasmo-font-medium plasmo-transition-colors ${D ? "plasmo-text-neutral-400 hover:plasmo-text-white" : "plasmo-text-neutral-500 hover:plasmo-text-neutral-900"}`}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            className={`plasmo-h-8 plasmo-px-5 plasmo-text-xs plasmo-font-semibold plasmo-text-white plasmo-transition-all hover:plasmo-opacity-90 active:plasmo-scale-[0.97] ${D ? "plasmo-bg-blue-600" : "plasmo-bg-blue-600"}`}
                        >
                            Insert
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
